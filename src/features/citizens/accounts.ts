import "server-only";
import { randomUUID } from "node:crypto";
import sql from "@/server/db/owner";
import { newToken, sha256 } from "@/server/security/tokens";
import { audit } from "@/server/security/audit";
import { decryptText, emailIndex, encryptText } from "@/server/security/crypto";

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

// For actions a signed in citizen has to confirm with their password.
export async function findCitizenById(id: string): Promise<CitizenAccount | null> {
  const [row] = await sql<CitizenAccount[]>`
    select id, password_hash from citizen_users where id = ${id}
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

// For the status emails. An account deleted since then is simply left out.
export async function citizenEmails(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await sql<{ id: string; email: string }[]>`
    select id, email from citizen_users where id in ${sql(ids)}
  `;
  return new Map(rows.map((r) => [r.id, decryptText(r.email, `citizen:${r.id}:email`)]));
}

export async function rehashCitizenPassword(id: string, passwordHash: string) {
  await sql`update citizen_users set password_hash = ${passwordHash}, updated_at = now() where id = ${id}`;
}

// From the c5 research: a reset link lasts 15 minutes and works once.
export const RESET_MINUTES = 15;

// A new link replaces any older one for the account. Returns the raw token for the email.
export async function createPasswordReset(userId: string) {
  const { token, hash } = newToken();
  await sql.begin(async (tx) => {
    await tx`delete from citizen_password_resets where user_id = ${userId} or expires_at <= now()`;
    await tx`
      insert into citizen_password_resets (user_id, token_hash, expires_at)
      values (${userId}, ${hash}, now() + ${RESET_MINUTES}::int * interval '1 minute')
    `;
  });
  return token;
}

export type PasswordReset = { id: string; userId: string; email: string };

// Looks a link up without using it, so the page can say early that it expired.
export async function findPasswordReset(token: string): Promise<PasswordReset | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [row] = await sql`
    select r.id, u.id as user_id, u.email
    from citizen_password_resets r
    join citizen_users u on u.id = r.user_id
    where r.token_hash = ${sha256(token)} and r.expires_at > now()
  `;
  if (!row) return null;
  return { id: row.id, userId: row.user_id, email: decryptText(row.email, `citizen:${row.user_id}:email`) };
}

// Using the link, saving the password and signing out every device happen together, so the
// link works once and a session someone else may hold ends with the old password.
export async function redeemPasswordReset(reset: PasswordReset, passwordHash: string): Promise<boolean> {
  return sql.begin(async (tx) => {
    const [taken] = await tx`
      delete from citizen_password_resets where id = ${reset.id} and expires_at > now() returning id
    `;
    if (!taken) return false;
    await tx`delete from citizen_password_resets where user_id = ${reset.userId}`;
    await tx`update citizen_users set password_hash = ${passwordHash}, updated_at = now() where id = ${reset.userId}`;
    await tx`delete from citizen_sessions where user_id = ${reset.userId}`;
    return true;
  });
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
