import "server-only";
import { z } from "zod";

const secret = z.string().regex(/^[0-9a-f]{64}$/i, "must be 64 hex characters");

const schema = z.object({
  STAFF_PASSWORD_PEPPER: secret,
  MFA_ENCRYPTION_KEY: secret,
  ALTCHA_HMAC_KEY: secret,
  WEBAUTHN_RP_ID: z.string().min(1),
  WEBAUTHN_ORIGIN: z.string().url(),
});

let checked: z.infer<typeof schema> | null = null;

// A missing or malformed secret stops auth outright instead of quietly weakening it.
export function authEnv() {
  if (!checked) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const keys = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Auth settings missing or invalid in .env: ${keys}`);
    }
    checked = parsed.data;
  }
  return checked;
}
