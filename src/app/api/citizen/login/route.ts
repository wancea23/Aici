import { z } from "zod";
import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json, tooMany } from "@/lib/auth/http";
import { challengeDue, clearLimit, peek, recordFailure, rules } from "@/lib/auth/rate-limit";
import { verifyAltcha } from "@/lib/auth/altcha";
import { burnPasswordCheck, hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import { auditCitizen, findCitizenByEmail, findPendingSignup, rehashCitizenPassword } from "@/lib/auth/citizen";
import { startCitizenSession } from "@/lib/auth/citizen-session";
import { safeNext } from "@/lib/auth/redirect";
import { emailIndex } from "@/lib/crypto";

export const runtime = "nodejs";

const input = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(1024),
  altcha: z.string().max(4096).optional(),
  next: z.string().max(512).optional(),
});

// Same rules as the staff login, with counters of its own.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Completează emailul și parola.");
  const { email, password, altcha } = parsed.data;

  const ipKey = clientInfo(req).ip ?? "unknown";
  const accountKey = emailIndex(email);

  const [byIp, byAccount] = await Promise.all([
    peek(rules.citizenLoginIp, ipKey),
    peek(rules.citizenLoginAccount, accountKey),
  ]);
  if (byIp.blocked || byAccount.blocked) {
    return tooMany(Math.max(byIp.retryAfter, byAccount.retryAfter));
  }
  if ((byIp.needsChallenge || byAccount.needsChallenge) && !(await verifyAltcha(altcha))) {
    return fail(400, "Bifează verificarea de mai jos și încearcă din nou.", { challenge: true });
  }

  // Exactly one hash in every case: the account's, the one of a sign up still waiting for
  // its link, or a dummy. Both lookups run every time, so timing doesn't reveal which.
  const [user, signup] = await Promise.all([findCitizenByEmail(email), findPendingSignup(email)]);
  const stored = user?.password_hash ?? signup?.password_hash;
  const ok = stored ? await verifyPassword(stored, password) : await burnPasswordCheck(password);

  // Only said once the password is right, so it tells a stranger nothing.
  if (ok && !user) {
    return fail(403, "Nu ai confirmat încă emailul. Deschide linkul primit sau înregistrează-te din nou ca să primești altul.");
  }

  if (!ok || !user) {
    const [ipCount, accountCount] = await Promise.all([
      recordFailure(rules.citizenLoginIp, ipKey),
      recordFailure(rules.citizenLoginAccount, accountKey),
    ]);
    await auditCitizen("citizen.login", "failure", user?.id, { reason: user ? "wrong_password" : "unknown_email" });
    return fail(401, "Email sau parolă greșită.", {
      challenge: challengeDue(rules.citizenLoginIp, ipCount) || challengeDue(rules.citizenLoginAccount, accountCount),
    });
  }

  await clearLimit(rules.citizenLoginAccount, accountKey);
  if (needsRehash(user.password_hash)) {
    await rehashCitizenPassword(user.id, await hashPassword(password));
  }

  await startCitizenSession(user.id);
  await auditCitizen("citizen.login", "success", user.id);
  return json({ next: safeNext(parsed.data.next, "/") });
}
