import { z } from "zod";
import { sameOrigin } from "@/server/security/csrf";
import { clientInfo } from "@/server/http/request";
import { fail, json } from "@/server/http/responses";
import { requireStaffApi } from "@/features/staff/dal";
import { applyStaffAction, createResetLink, findStaffById, linkFor } from "@/features/staff/accounts";
import { audit } from "@/server/security/audit";
import { isUuid } from "@/features/reports/validation";

const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("deactivate") }),
  z.object({ action: z.literal("reactivate") }),
  z.object({ action: z.literal("role"), role: z.enum(["operator", "admin"]) }),
  z.object({ action: z.literal("force_reset") }),
  z.object({ action: z.literal("reset_link") }),
]);

const logAction = {
  deactivate: "staff.deactivated",
  reactivate: "staff.reactivated",
  role: "staff.role_changed",
  force_reset: "staff.force_reset",
  reset_link: "staff.reset_link",
} as const;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const auth = await requireStaffApi({ role: "admin" });
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!isUuid(id)) return fail(404, "Contul nu există.");
  // Keeps an admin from locking themselves out, so there is always at least one admin left.
  if (id === auth.user.id) return fail(400, "Propriul cont se schimbă din pagina Contul meu.");

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Acțiune necunoscută.");
  const data = parsed.data;

  const target = await findStaffById(id);
  if (!target) return fail(404, "Contul nu există.");

  let result: Record<string, unknown> = { ok: true };
  if (data.action === "reset_link") {
    if (!target.is_active) return fail(400, "Contul este dezactivat.");
    const token = await createResetLink(target.id, target.email, auth.user.id);
    result = { link: linkFor(req, "/reset-password", token) };
  } else {
    await applyStaffAction(target.id, data.action, data.action === "role" ? data.role : undefined);
  }

  await audit({
    actorId: auth.user.id,
    action: logAction[data.action],
    status: "success",
    targetType: "staff_user",
    targetId: target.id,
    client: clientInfo(req),
    details: data.action === "role" ? { from: target.role, to: data.role } : {},
  });
  return json(result);
}
