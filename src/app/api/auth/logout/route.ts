import { sameOrigin } from "@/server/security/csrf";
import { clientInfo } from "@/server/http/request";
import { fail, json } from "@/server/http/responses";
import { clearSessionCookie, currentSession, deleteCurrentSession } from "@/features/staff/session";
import { audit } from "@/server/security/audit";
import { safeRoute } from "@/server/http/safe-route";

async function handlePost(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const current = await currentSession();
  await deleteCurrentSession();
  await clearSessionCookie();

  if (current) {
    await audit({ actorId: current.user.id, action: "auth.logout", status: "success", client: clientInfo(req) });
  }
  return json({ next: "/login" });
}

export const POST = safeRoute(handlePost);
