import { z } from "zod";
import sql from "@/lib/db";
import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json, tooMany } from "@/lib/auth/http";
import { challengeDue, clearLimit, peek, recordFailure, rules } from "@/lib/auth/rate-limit";
import { verifyAltcha } from "@/lib/auth/altcha";
import { burnPasswordCheck, hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import { findStaffByEmail } from "@/lib/auth/staff";
import { startSession } from "@/lib/auth/session";
import { audit } from "@/lib/auth/audit";
import { sha256 } from "@/lib/auth/tokens";
import { safeNext } from "@/lib/auth/redirect";

export const runtime = "nodejs";

const input = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(1024),
  altcha: z.string().max(4096).optional(),
  next: z.string().max(512).optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Completează emailul și parola.");
  const { email, password, altcha } = parsed.data;

  const client = clientInfo(req);
  const ipKey = client.ip ?? "unknown";
  // The same counters apply whether or not the email exists, so they reveal nothing.
  const accountKey = sha256(email.toLowerCase());

  const [byIp, byAccount] = await Promise.all([
    peek(rules.loginIp, ipKey),
    peek(rules.loginAccount, accountKey),
  ]);
  if (byIp.blocked || byAccount.blocked) {
    return tooMany(Math.max(byIp.retryAfter, byAccount.retryAfter));
  }
  if ((byIp.needsChallenge || byAccount.needsChallenge) && !(await verifyAltcha(altcha))) {
    return fail(400, "Bifează verificarea de mai jos și încearcă din nou.", { challenge: true });
  }

  const user = await findStaffByEmail(email);
  const ok =
    user && user.is_active
      ? await verifyPassword(user.password_hash, password)
      : await burnPasswordCheck(password);

  if (!user || !ok) {
    const [ipCount, accountCount] = await Promise.all([
      recordFailure(rules.loginIp, ipKey),
      recordFailure(rules.loginAccount, accountKey),
    ]);
    await audit({
      action: "auth.login",
      status: "failure",
      targetType: user ? "staff_user" : undefined,
      targetId: user?.id,
      client,
      details: { reason: !user ? "unknown_email" : user.is_active ? "wrong_password" : "inactive" },
    });
    return fail(401, "Email sau parolă greșită.", {
      challenge: challengeDue(rules.loginIp, ipCount) || challengeDue(rules.loginAccount, accountCount),
    });
  }

  await clearLimit(rules.loginAccount, accountKey);
  if (needsRehash(user.password_hash)) {
    const fresh = await hashPassword(password);
    await sql`update staff_users set password_hash = ${fresh}, updated_at = now() where id = ${user.id}`;
  }

  await startSession(user.id, client);
  await audit({
    actorId: user.id,
    action: "auth.login",
    status: "success",
    targetType: "staff_user",
    targetId: user.id,
    client,
  });

  return json({ next: user.force_password_reset ? "/cont/parola" : safeNext(parsed.data.next) });
}
