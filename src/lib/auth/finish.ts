import "server-only";
import { upgradeSession, type SessionResult } from "@/lib/auth/session";
import { clearLimit, rules } from "@/lib/auth/rate-limit";
import { listFactors, replaceRecoveryCodes } from "@/lib/auth/mfa";
import { audit } from "@/lib/auth/audit";
import { safeNext } from "@/lib/auth/redirect";
import type { ClientInfo } from "@/lib/auth/request";

// The second factor passed: swap the pending session for a full one.
export async function finishMfa(auth: SessionResult, client: ClientInfo, method: string, next: unknown) {
  await upgradeSession(auth.session.id, auth.user.id, client);
  await clearLimit(rules.mfa, auth.user.id);
  await audit({ actorId: auth.user.id, action: "auth.login.mfa", status: "success", client, details: { method } });
  return auth.user.forcePasswordReset ? "/cont/parola" : safeNext(next);
}

// "first" is enrollment right after the password, allowed only while the account has no
// factor yet. "extra" is adding one from the account page on a full session.
export async function enrollmentMode(auth: SessionResult): Promise<"first" | "extra" | null> {
  if (auth.session.mfaVerified) return "extra";
  return (await listFactors(auth.user.id)).length === 0 ? "first" : null;
}

// After a factor is saved. On first enrollment the recovery codes are made and shown once,
// then the session becomes a full one.
export async function afterEnroll(
  auth: SessionResult,
  mode: "first" | "extra",
  client: ClientInfo,
  type: "totp" | "webauthn",
  next: unknown
) {
  await audit({ actorId: auth.user.id, action: "auth.mfa.enrolled", status: "success", client, details: { type } });
  if (mode === "extra") return { ok: true };

  const recoveryCodes = await replaceRecoveryCodes(auth.user.id);
  await audit({ actorId: auth.user.id, action: "auth.recovery_codes.generated", status: "success", client });
  return { recoveryCodes, next: await finishMfa(auth, client, `enroll_${type}`, next) };
}
