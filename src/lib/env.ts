import "server-only";
import { z } from "zod";

const secret = z.string().regex(/^[0-9a-f]{64}$/i, "must be 64 hex characters");

const schema = z.object({
  STAFF_PASSWORD_PEPPER: secret,
  DATA_ENCRYPTION_KEY: secret,
  ALTCHA_HMAC_KEY: secret,
});

let checked: z.infer<typeof schema> | null = null;

// A missing or malformed secret stops the app outright instead of quietly weakening it.
export function serverEnv() {
  if (!checked) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const keys = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Secrets missing or invalid in .env: ${keys}`);
    }
    checked = parsed.data;
  }
  return checked;
}

// Email settings are optional. Without SMTP_HOST, development prints messages to the terminal.
const blank = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const mailSchema = z.object({
  APP_URL: z.preprocess(blank, z.string().url().optional()),
  SMTP_HOST: z.preprocess(blank, z.string().optional()),
  SMTP_PORT: z.preprocess(blank, z.coerce.number().int().min(1).max(65535).default(465)),
  SMTP_USER: z.preprocess(blank, z.string().optional()),
  SMTP_PASS: z.preprocess(blank, z.string().optional()),
  MAIL_FROM: z.preprocess(blank, z.string().optional()),
});

let mail: z.infer<typeof mailSchema> | null = null;

export function mailEnv() {
  if (!mail) {
    const parsed = mailSchema.safeParse(process.env);
    if (!parsed.success) {
      const keys = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Email settings invalid in .env: ${keys}`);
    }
    mail = parsed.data;
  }
  return mail;
}
