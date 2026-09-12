import { z } from "zod";
import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json, tooMany } from "@/lib/auth/http";
import { requireStaffApi } from "@/lib/auth/dal";
import { peek, recordFailure, rules } from "@/lib/auth/rate-limit";
import { checkTotp, recoveryCodesLeft, redeemRecoveryCode } from "@/lib/auth/mfa";
import { finishMfa } from "@/lib/auth/finish";
import { audit } from "@/lib/auth/audit";

const input = z.object({
  method: z.enum(["totp", "recovery"]),
  code: z.string().min(1).max(64),
  next: z.string().max(512).optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const auth = await requireStaffApi({ allowPending: true });
  if (!auth.ok) return auth.response;
  if (auth.session.mfaVerified) return fail(400, "Ești deja autentificat.");

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Scrie codul.");
  const { method, code, next } = parsed.data;
  const client = clientInfo(req);
  const userId = auth.user.id;

  const limit = await peek(rules.mfa, userId);
  if (limit.blocked) return tooMany(limit.retryAfter);

  const ok = method === "totp" ? Boolean(await checkTotp(userId, code)) : await redeemRecoveryCode(userId, code);
  if (!ok) {
    await recordFailure(rules.mfa, userId);
    await audit({ actorId: userId, action: "auth.login.mfa", status: "failure", client, details: { method } });
    return fail(
      401,
      method === "totp" ? "Cod greșit sau expirat." : "Cod de recuperare greșit sau deja folosit."
    );
  }

  if (method === "recovery") {
    await audit({
      actorId: userId,
      action: "auth.recovery_code.used",
      status: "success",
      client,
      details: { left: await recoveryCodesLeft(userId) },
    });
  }
  return json({ next: await finishMfa(auth, client, method, next) });
}
