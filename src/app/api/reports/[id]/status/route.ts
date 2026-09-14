import sql from "@/lib/db";
import { isUuid, statusInput } from "@/lib/validation";
import { requireStaffApi } from "@/lib/auth/dal";
import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json } from "@/lib/auth/http";
import { audit } from "@/lib/auth/audit";

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
    return fail(400, "status invalid");
  }

  // A group changes together: its first report and the ones grouped under it. Only rows that
  // really change are written, and the log keeps the first report's old status.
  const result = await sql.begin(async (tx) => {
    const [root] = await tx`
      select id, status from reports
      where id = (select coalesce(duplicate_of, id) from reports where id = ${id})
      for update
    `;
    if (!root) return null;
    const moved = await tx`
      update reports set status = ${parsed.data.status}
      where (id = ${root.id} or duplicate_of = ${root.id}) and status <> ${parsed.data.status}
    `;
    return { id: root.id as string, from: root.status as string, count: moved.count };
  });

  if (!result) {
    return fail(404, "sesizare inexistentă");
  }

  if (result.count > 0) {
    await audit({
      actorId: auth.user.id,
      action: "report.status_changed",
      status: "success",
      targetType: "report",
      targetId: result.id,
      client: clientInfo(req),
      details: { from: result.from, to: parsed.data.status, reports: result.count },
    });
  }

  return json({ ok: true });
}
