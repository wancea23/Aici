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

  // The old status comes back too, so the log shows the change from and to.
  const [row] = await sql`
    with old as (select id, status from reports where id = ${id} for update)
    update reports r
    set status = ${parsed.data.status}
    from old
    where r.id = old.id
    returning old.status as from_status
  `;

  if (!row) {
    return fail(404, "sesizare inexistentă");
  }

  if (row.from_status !== parsed.data.status) {
    await audit({
      actorId: auth.user.id,
      action: "report.status_changed",
      status: "success",
      targetType: "report",
      targetId: id,
      client: clientInfo(req),
      details: { from: row.from_status, to: parsed.data.status },
    });
  }

  return json({ ok: true });
}
