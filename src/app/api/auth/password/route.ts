import { z } from "zod";
import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json, tooMany } from "@/lib/auth/http";
import { requireStaffApi } from "@/lib/auth/dal";
import { clearLimit, peek, recordFailure, rules } from "@/lib/auth/rate-limit";
import { hashPassword, normalizePassword, validateNewPassword, verifyPassword } from "@/lib/auth/password";
import { changePassword, findStaffById } from "@/lib/auth/staff";
import { replaceAllSessions } from "@/lib/auth/session";
import { audit } from "@/lib/auth/audit";

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

  const limit = await peek(rules.mfa, limitKey);
  if (limit.blocked) return tooMany(limit.retryAfter);

  const user = await findStaffById(auth.user.id);
  if (!user || !(await verifyPassword(user.password_hash, current))) {
    await recordFailure(rules.mfa, limitKey);
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
  await clearLimit(rules.mfa, limitKey);
  await audit({ actorId: user.id, action: "auth.password.changed", status: "success", client });

  return json({ next: "/panou" });
}
