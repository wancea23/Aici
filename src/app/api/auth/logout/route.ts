import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json } from "@/lib/auth/http";
import { clearSessionCookie, currentSession, deleteCurrentSession } from "@/lib/auth/session";
import { audit } from "@/lib/auth/audit";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const current = await currentSession();
  await deleteCurrentSession();
  await clearSessionCookie();

  if (current) {
    await audit({ actorId: current.user.id, action: "auth.logout", status: "success", client: clientInfo(req) });
  }
  return json({ next: "/login" });
}
