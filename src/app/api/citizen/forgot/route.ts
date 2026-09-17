import { after } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/server/security/csrf";
import { clientInfo } from "@/server/http/request";
import { fail, json, tooMany } from "@/server/http/responses";
import { countAttempt, peek, rules } from "@/server/security/rate-limit";
import { verifyAltcha } from "@/server/security/altcha";
import { RESET_MINUTES, auditCitizen, createPasswordReset, findCitizenByEmail } from "@/features/citizens/accounts";
import { emailIndex } from "@/server/security/crypto";
import { appUrl, canSendMail, passwordResetMail, sendMail } from "@/server/mail";

export const runtime = "nodejs";

const input = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
  altcha: z.string().max(4096).optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Scrie o adresă de email validă.");
  const { email, altcha } = parsed.data;

  const base = appUrl(req);
  if (!base || !canSendMail()) {
    console.error("password reset needs APP_URL and SMTP_HOST in production");
    return fail(503, "Resetarea parolei nu merge acum. Încearcă mai târziu.");
  }

  const ipKey = clientInfo(req).ip ?? "unknown";
  const emailKey = emailIndex(email);
  const [byIp, byEmail] = await Promise.all([peek(rules.resetIp, ipKey), peek(rules.resetEmail, emailKey)]);
  if (byIp.blocked || byEmail.blocked) return tooMany(Math.max(byIp.retryAfter, byEmail.retryAfter));

  // Always asked for, since every request can send an email.
  if (!(await verifyAltcha(altcha))) {
    return fail(400, "Bifează verificarea de mai jos și încearcă din nou.", { challenge: true });
  }

  await Promise.all([countAttempt(rules.resetIp, ipKey), countAttempt(rules.resetEmail, emailKey)]);

  // The lookup and the email run after the answer is sent, so neither the answer nor its
  // timing tells whether the address has an account. An unknown address gets no email.
  after(async () => {
    try {
      const account = await findCitizenByEmail(email);
      if (account) {
        const token = await createPasswordReset(account.id);
        await sendMail(passwordResetMail(email, `${base}/new-password?token=${token}`, RESET_MINUTES));
      }
      await auditCitizen("citizen.password_reset_requested", "success", account?.id, { existing: Boolean(account) });
    } catch (err) {
      console.error("password reset request failed after the answer was sent", err);
    }
  });

  return json({ sent: true });
}
