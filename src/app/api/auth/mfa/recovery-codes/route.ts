import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json } from "@/lib/auth/http";
import { requireStaffApi } from "@/lib/auth/dal";
import { replaceRecoveryCodes } from "@/lib/auth/mfa";
import { audit } from "@/lib/auth/audit";

// New codes; the old ones stop working.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const auth = await requireStaffApi();
  if (!auth.ok) return auth.response;

  const recoveryCodes = await replaceRecoveryCodes(auth.user.id);
  await audit({
    actorId: auth.user.id,
    action: "auth.recovery_codes.generated",
    status: "success",
    client: clientInfo(req),
  });
  return json({ recoveryCodes });
}
