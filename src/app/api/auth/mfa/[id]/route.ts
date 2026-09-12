import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json } from "@/lib/auth/http";
import { requireStaffApi } from "@/lib/auth/dal";
import { deleteFactor } from "@/lib/auth/mfa";
import { audit } from "@/lib/auth/audit";
import { isUuid } from "@/lib/validation";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const auth = await requireStaffApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!isUuid(id)) return fail(404, "Metoda nu există.");

  // Only the user's own factors are found, someone else's id looks like a missing one.
  const result = await deleteFactor(auth.user.id, id);
  if (!result) return fail(404, "Metoda nu există.");
  if (result === "last") {
    return fail(400, "Nu poți șterge singura metodă de verificare. Adaugă alta mai întâi.");
  }

  await audit({
    actorId: auth.user.id,
    action: "auth.mfa.removed",
    status: "success",
    targetType: "mfa_credential",
    targetId: id,
    client: clientInfo(req),
    details: { type: result },
  });
  return json({ ok: true });
}
