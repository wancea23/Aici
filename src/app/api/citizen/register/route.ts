import { after } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json, tooMany } from "@/lib/auth/http";
import { countAttempt, peek, rules } from "@/lib/auth/rate-limit";
import { verifyAltcha } from "@/lib/auth/altcha";
import { hashPassword, validateNewPassword } from "@/lib/auth/password";
import { auditCitizen, createSignup, findCitizenByEmail } from "@/lib/auth/citizen";
import { emailIndex } from "@/lib/crypto";
import { appUrl, canSendMail, existingAccountMail, sendMail, signupMail } from "@/lib/mail";

export const runtime = "nodejs";

const input = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
  password: z.string().min(1).max(1024),
  altcha: z.string().max(4096).optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Scrie o adresă de email validă și o parolă.");
  const { email, password, altcha } = parsed.data;

  const base = appUrl(req);
  if (!base || !canSendMail()) {
    console.error("sign up needs APP_URL and SMTP_HOST in production");
    return fail(503, "Înregistrarea nu merge acum. Încearcă mai târziu.");
  }

  const ipKey = clientInfo(req).ip ?? "unknown";
  const emailKey = emailIndex(email);
  const [byIp, byEmail] = await Promise.all([
    peek(rules.registerIp, ipKey),
    peek(rules.registerEmail, emailKey),
  ]);
  if (byIp.blocked || byEmail.blocked) return tooMany(Math.max(byIp.retryAfter, byEmail.retryAfter));

  // Always asked for here: every sign up sends an email, and bots shouldn't get to send them.
  if (!(await verifyAltcha(altcha))) {
    return fail(400, "Bifează verificarea de mai jos și încearcă din nou.", { challenge: true });
  }

  const problem = await validateNewPassword(password, email, "citizen");
  if (problem) return fail(400, problem);

  await Promise.all([countAttempt(rules.registerIp, ipKey), countAttempt(rules.registerEmail, emailKey)]);

  // Everything that depends on whether the address already has an account runs after the
  // answer is sent, so neither the answer nor its timing gives that away. The owner of the
  // address learns which case it was from the email.
  after(async () => {
    try {
      const existing = await findCitizenByEmail(email);
      if (existing) {
        await sendMail(existingAccountMail(email, base));
      } else {
        const token = await createSignup(email, await hashPassword(password));
        await sendMail(signupMail(email, `${base}/verificare?token=${token}`));
      }
      await auditCitizen("citizen.signup", "success", existing?.id, { existing: Boolean(existing) });
    } catch (err) {
      console.error("sign up failed after the answer was sent", err);
    }
  });

  return json({ sent: true });
}
