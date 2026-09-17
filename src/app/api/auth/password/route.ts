import { z } from "zod";
import { sameOrigin } from "@/server/security/csrf";
import { clientInfo } from "@/server/http/request";
import { fail, json, tooMany } from "@/server/http/responses";
import { requireStaffApi } from "@/features/staff/dal";
import { clearLimit, peek, recordFailure, rules } from "@/server/security/rate-limit";
import { hashPassword, normalizePassword, validateNewPassword, verifyPassword } from "@/server/security/password";
import { changePassword, findStaffById } from "@/features/staff/accounts";
import { replaceAllSessions } from "@/features/staff/session";
import { audit } from "@/server/security/audit";

export const runtime = "nodejs";

const input = z.object({
  current: z.string().min(1).max(1024),
  password: z.string().min(1).max(1024),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const auth = await requireStaffApi({ allowPasswordReset: true });
  if (!auth.ok) return auth.response;

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Completează ambele parole.");
  const { current, password } = parsed.data;
  const client = clientInfo(req);
  const limitKey = `password:${auth.user.id}`;

  const limit = await peek(rules.password, limitKey);
  if (limit.blocked) return tooMany(limit.retryAfter);

  const user = await findStaffById(auth.user.id);
  if (!user || !(await verifyPassword(user.password_hash, current))) {
    await recordFailure(rules.password, limitKey);
    await audit({ actorId: auth.user.id, action: "auth.password.changed", status: "failure", client });
    return fail(400, "Parola actuală e greșită.");
  }
  if (normalizePassword(current) === normalizePassword(password)) {
    return fail(400, "Parola nouă trebuie să fie diferită de cea actuală.");
  }

  const problem = await validateNewPassword(password, user.email);
  if (problem) return fail(400, problem);

  await changePassword(user.id, await hashPassword(password));
  await replaceAllSessions(user.id, client, auth.session.expiresAt);
  await clearLimit(rules.password, limitKey);
  await audit({ actorId: user.id, action: "auth.password.changed", status: "success", client });

  return json({ next: "/dashboard" });
}
