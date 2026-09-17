import { after } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/server/security/csrf";
import { clientInfo } from "@/server/http/request";
import { fail, json, tooMany } from "@/server/http/responses";
import { peek, recordFailure, rules } from "@/server/security/rate-limit";
import { hashPassword, validateNewPassword } from "@/server/security/password";
import { auditCitizen, findPasswordReset, redeemPasswordReset } from "@/features/citizens/accounts";
import { appUrl, canSendMail, passwordChangedMail, sendMail } from "@/server/mail";

export const runtime = "nodejs";

const input = z.object({
  token: z.string().max(128),
  password: z.string().min(1).max(1024),
});

const EXPIRED = "Linkul nu mai este valabil sau a fost deja folosit. Cere unul nou.";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Alege o parolă.");
  const ipKey = clientInfo(req).ip ?? "unknown";

  const limit = await peek(rules.tokenIp, ipKey);
  if (limit.blocked) return tooMany(limit.retryAfter);

  const reset = await findPasswordReset(parsed.data.token);
  if (!reset) {
    await recordFailure(rules.tokenIp, ipKey);
    return fail(400, EXPIRED);
  }

  const problem = await validateNewPassword(parsed.data.password, reset.email, "citizen");
  if (problem) return fail(400, problem);

  if (!(await redeemPasswordReset(reset, await hashPassword(parsed.data.password)))) {
    return fail(400, EXPIRED);
  }
  await auditCitizen("citizen.password_reset", "success", reset.userId);

  const base = appUrl(req);
  if (base && canSendMail()) {
    after(async () => {
      try {
        await sendMail(passwordChangedMail(reset.email, base));
      } catch (err) {
        console.error("password changed email failed", err);
      }
    });
  }

  return json({ done: true });
}
