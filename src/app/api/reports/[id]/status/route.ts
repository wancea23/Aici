import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { withAccess } from "@/server/db/access";
import { categoryLabels, isUuid, statusInput, statusLabels, type Category, type Status } from "@/features/reports/validation";
import { encryptText } from "@/server/security/crypto";
import { formatDay } from "@/ui/format";
import { appUrl, canSendMail, sendMail, statusMail } from "@/server/mail";
import { requireStaffApi } from "@/features/staff/dal";
import { sameOrigin } from "@/server/security/csrf";
import { clientInfo } from "@/server/http/request";
import { fail, json } from "@/server/http/responses";
import { audit } from "@/server/security/audit";
import { citizenEmails } from "@/features/citizens/accounts";
import { countAttempt, rules } from "@/server/security/rate-limit";

type GroupRow = { id: string; category: string; status: string; citizen_id: string | null; created_at: Date };

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(req)) return fail(403, "cerere respinsă");

  const auth = await requireStaffApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!isUuid(id)) {
    return fail(404, "sesizare inexistentă");
  }

  const body = await req.json().catch(() => null);
  const parsed = statusInput.safeParse(body);
  if (!parsed.success) {
    const noteIssue = parsed.error.issues.find((issue) => issue.path[0] === "note");
    return fail(400, noteIssue?.message ?? "status invalid");
  }
  const { status, note } = parsed.data;

  // A group changes together: its first report and the ones grouped under it. Every report
  // whose status changes, or that gets a message, gets a line in its history. requireStaffApi
  // already verified this request, so app.is_staff is safe to set for row-level security.
  const result = await withAccess({ staff: true }, async (tx) => {
    const [root] = await tx`
      select id, status from reports
      where id = (select coalesce(duplicate_of, id) from reports where id = ${id})
      for update
    `;
    if (!root) return null;

    const group = await tx<GroupRow[]>`
      select id, category, status, citizen_id, created_at from reports
      where id = ${root.id} or duplicate_of = ${root.id}
      order by created_at
      for update
    `;
    const touched = group.filter((r) => r.status !== status || note !== "");
    if (touched.length > 0) {
      await tx`
        update reports set status = ${status}
        where (id = ${root.id} or duplicate_of = ${root.id}) and status <> ${status}
      `;
      const events = touched.map((r) => {
        const eventId = randomUUID();
        return {
          id: eventId,
          report_id: r.id,
          status,
          previous_status: r.status,
          note: note ? encryptText(note, `event:${eventId}:note`) : null,
          staff_id: auth.user.id,
        };
      });
      await tx`insert into report_events ${tx(events)}`;
    }
    return { id: root.id as string, from: root.status as string, touched };
  });

  if (!result) {
    return fail(404, "sesizare inexistentă");
  }
  if (result.touched.length === 0) {
    return json({ ok: true });
  }

  const changed = result.touched.filter((r) => r.status !== status).length;
  await audit({
    actorId: auth.user.id,
    action: changed > 0 ? "report.status_changed" : "report.note_added",
    status: "success",
    targetType: "report",
    targetId: result.id,
    client: clientInfo(req),
    // whether there was a message, never the message itself
    details: { from: result.from, to: status, reports: result.touched.length, note: note !== "" },
  });

  // One email per citizen, even with several of their reports in the group.
  const reporters = new Map<string, GroupRow>();
  for (const r of result.touched) {
    if (r.citizen_id && !reporters.has(r.citizen_id)) reporters.set(r.citizen_id, r);
  }
  const base = appUrl(req);
  if (reporters.size > 0) {
    after(async () => {
      if (!base || !canSendMail()) {
        console.error("status emails skipped, email is not set up");
        return;
      }
      const emails = await citizenEmails([...reporters.keys()]).catch((err) => {
        console.error("status emails skipped, could not read the addresses", err);
        return new Map<string, string>();
      });
      for (const [citizenId, report] of reporters) {
        const to = emails.get(citizenId);
        if (!to) continue;
        try {
          if ((await countAttempt(rules.statusMail, citizenId)) > rules.statusMail.max) continue;
          await sendMail(
            statusMail(
              to,
              {
                category: categoryLabels[report.category as Category] ?? report.category,
                reportedOn: formatDay(report.created_at.toISOString()),
                status: statusLabels[status as Status],
                statusChanged: report.status !== status,
                hasNote: note !== "",
              },
              base
            )
          );
        } catch (err) {
          console.error("status email failed", report.id, err);
        }
      }
    });
  }

  return json({ ok: true });
}
