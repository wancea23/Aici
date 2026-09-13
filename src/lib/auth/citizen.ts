import "server-only";
import { randomUUID } from "node:crypto";
import sql from "@/lib/db";
import { newToken, sha256 } from "@/lib/auth/tokens";
import { audit } from "@/lib/auth/audit";
import { decryptText, emailIndex, encryptText } from "@/lib/crypto";

// A sign up turns into an account only when its email link is opened. Before that nothing
// is in citizen_users, so nobody gets an account for an address they can't read.
const SIGNUP_HOURS = 24;

export type CitizenAccount = { id: string; password_hash: string };

export type Signup = { id: string; email: string; password_hash: string };

export async function findCitizenByEmail(email: string): Promise<CitizenAccount | null> {
  const [row] = await sql<CitizenAccount[]>`
    select id, password_hash from citizen_users where email_hash = ${emailIndex(email)}
  `;
  return row ?? null;
}

// The newest sign up still waiting for its link, so a login before confirming can say so.
export async function findPendingSignup(email: string) {
  const [row] = await sql<{ password_hash: string }[]>`
    select password_hash from citizen_signups
    where email_hash = ${emailIndex(email)} and expires_at > now()
    order by created_at desc
    limit 1
  `;
  return row ?? null;
}

// Returns the raw token for the email link, the database keeps only its hash.
export async function createSignup(email: string, passwordHash: string) {
  const id = randomUUID();
  const { token, hash } = newToken();
  // expired sign ups hold an email and a password hash for nothing
  await sql`delete from citizen_signups where expires_at <= now()`;
  await sql`
    insert into citizen_signups (id, email_hash, email, password_hash, token_hash, expires_at)
    values (
      ${id}, ${emailIndex(email)}, ${encryptText(email, `signup:${id}:email`)}, ${passwordHash}, ${hash},
      now() + ${SIGNUP_HOURS}::int * interval '1 hour'
    )
  `;
  return token;
}

// Looks a link up without using it, so the page can say early that it expired.
export async function findSignup(token: string): Promise<Signup | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [row] = await sql`
    select id, email, password_hash from citizen_signups
    where token_hash = ${sha256(token)} and expires_at > now()
  `;
  if (!row) return null;
  return {
    id: row.id,
    email: decryptText(row.email, `signup:${row.id}:email`),
    password_hash: row.password_hash,
  };
}

// Using the link and creating the account happen together, so a link works only once.
// The other sign ups for the same address stop working too.
export async function completeSignup(signup: Signup): Promise<{ id: string } | "used" | "exists"> {
  return sql.begin(async (tx) => {
    const [taken] = await tx`
      delete from citizen_signups where id = ${signup.id} and expires_at > now()
      returning email_hash
    `;
    if (!taken) return "used" as const;
    await tx`delete from citizen_signups where email_hash = ${taken.email_hash}`;

    const id = randomUUID();
    const [user] = await tx`
      insert into citizen_users (id, email_hash, email, password_hash)
      values (${id}, ${taken.email_hash}, ${encryptText(signup.email, `citizen:${id}:email`)}, ${signup.password_hash})
      on conflict (email_hash) do nothing
      returning id
    `;
    return user ? { id } : ("exists" as const);
  });
}

export async function rehashCitizenPassword(id: string, passwordHash: string) {
  await sql`update citizen_users set password_hash = ${passwordHash}, updated_at = now() where id = ${id}`;
}

// Citizen events go into the same audit log as staff ones, but without the address or
// browser: the log is never cleared, and nothing there needs them.
export function auditCitizen(
  action: string,
  status: "success" | "failure",
  citizenId?: string,
  details?: Record<string, unknown>
) {
  return audit({ action, status, targetType: citizenId ? "citizen_user" : undefined, targetId: citizenId, details });
}
