import "server-only";
import sql from "@/lib/db";
import { newToken, sha256 } from "@/lib/auth/tokens";
import type { Role } from "@/lib/auth/session";

// From the c5 research: invitations last 48 hours, reset links 15 minutes.
const INVITE_HOURS = 48;
const RESET_MINUTES = 15;

export type TokenType = "invite" | "password_reset";

export type StaffAccount = {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  is_active: boolean;
  force_password_reset: boolean;
};

export const roleLabels: Record<Role, string> = {
  operator: "Operator",
  admin: "Administrator",
};

export async function findStaffByEmail(email: string): Promise<StaffAccount | null> {
  const [row] = await sql<StaffAccount[]>`
    select id, email, password_hash, role, is_active, force_password_reset
    from staff_users where lower(email) = lower(${email})
  `;
  return row ?? null;
}

export async function findStaffById(id: string): Promise<StaffAccount | null> {
  const [row] = await sql<StaffAccount[]>`
    select id, email, password_hash, role, is_active, force_password_reset
    from staff_users where id = ${id}
  `;
  return row ?? null;
}

// A new invitation replaces an older unused one for the same address.
export async function createInvite(email: string, role: Role, createdBy: string) {
  const { token, hash } = newToken();
  await sql.begin(async (tx) => {
    await tx`
      update staff_credential_tokens set consumed_at = now()
      where lower(email) = lower(${email}) and token_type = 'invite' and consumed_at is null
    `;
    await tx`
      insert into staff_credential_tokens (email, token_hash, token_type, role, created_by, expires_at)
      values (${email}, ${hash}, 'invite', ${role}, ${createdBy}, now() + ${INVITE_HOURS}::int * interval '1 hour')
    `;
  });
  return token;
}

// Same for reset links: the newest one is the only one that works.
export async function createResetLink(userId: string, email: string, createdBy: string) {
  const { token, hash } = newToken();
  await sql.begin(async (tx) => {
    await tx`
      update staff_credential_tokens set consumed_at = now()
      where user_id = ${userId} and token_type = 'password_reset' and consumed_at is null
    `;
    await tx`
      insert into staff_credential_tokens (user_id, email, token_hash, token_type, created_by, expires_at)
      values (${userId}, ${email}, ${hash}, 'password_reset', ${createdBy},
              now() + ${RESET_MINUTES}::int * interval '1 minute')
    `;
  });
  return token;
}

export type TokenRow = { id: string; user_id: string | null; email: string; role: Role | null };

// Looks a link up without using it, so the page can say early that it expired.
export async function findToken(token: string, type: TokenType): Promise<TokenRow | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [row] = await sql<TokenRow[]>`
    select id, user_id, email, role from staff_credential_tokens
    where token_hash = ${sha256(token)} and token_type = ${type}
      and consumed_at is null and expires_at > now()
  `;
  return row ?? null;
}

// Using the link and creating the account happen together, so a link works only once.
export async function acceptInvite(
  tokenId: string,
  email: string,
  role: Role,
  passwordHash: string
): Promise<{ id: string } | "used" | "exists"> {
  return sql.begin(async (tx) => {
    const [taken] = await tx`
      update staff_credential_tokens set consumed_at = now()
      where id = ${tokenId} and consumed_at is null and expires_at > now()
      returning id
    `;
    if (!taken) return "used" as const;
    const [existing] = await tx`select id from staff_users where lower(email) = lower(${email})`;
    if (existing) return "exists" as const;
    const [user] = await tx`
      insert into staff_users (email, password_hash, role) values (${email}, ${passwordHash}, ${role})
      returning id
    `;
    return { id: user.id as string };
  });
}

// A reset signs the person out everywhere. Their MFA stays as it was.
export async function redeemReset(tokenId: string, userId: string, passwordHash: string) {
  return sql.begin(async (tx) => {
    const [taken] = await tx`
      update staff_credential_tokens set consumed_at = now()
      where id = ${tokenId} and consumed_at is null and expires_at > now()
      returning id
    `;
    if (!taken) return false;
    await tx`
      update staff_users
      set password_hash = ${passwordHash}, force_password_reset = false,
          password_changed_at = now(), updated_at = now()
      where id = ${userId}
    `;
    await tx`delete from staff_sessions where user_id = ${userId}`;
    return true;
  });
}

export async function changePassword(userId: string, passwordHash: string) {
  await sql`
    update staff_users
    set password_hash = ${passwordHash}, force_password_reset = false,
        password_changed_at = now(), updated_at = now()
    where id = ${userId}
  `;
}

export type StaffAction = "deactivate" | "reactivate" | "role" | "force_reset" | "reset_mfa";

// Admin changes. Anything that changes what a person may do also ends their sessions.
export async function applyStaffAction(userId: string, action: StaffAction, role?: Role) {
  await sql.begin(async (tx) => {
    switch (action) {
      case "deactivate":
        await tx`update staff_users set is_active = false, updated_at = now() where id = ${userId}`;
        break;
      case "reactivate":
        await tx`update staff_users set is_active = true, updated_at = now() where id = ${userId}`;
        break;
      case "role":
        await tx`update staff_users set role = ${role ?? "operator"}, updated_at = now() where id = ${userId}`;
        break;
      case "force_reset":
        await tx`update staff_users set force_password_reset = true, updated_at = now() where id = ${userId}`;
        break;
      case "reset_mfa":
        // for a lost phone: the next login asks to set up a factor again
        await tx`delete from staff_mfa_credentials where user_id = ${userId}`;
        await tx`delete from staff_recovery_codes where user_id = ${userId}`;
        break;
    }
    if (action !== "reactivate") {
      await tx`delete from staff_sessions where user_id = ${userId}`;
    }
  });
}

export type StaffListItem = {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  forceReset: boolean;
  factors: number;
  createdAt: string;
  lastLogin: string | null;
};

export async function listStaff(): Promise<StaffListItem[]> {
  const rows = await sql`
    select u.id, u.email, u.role, u.is_active, u.force_password_reset, u.created_at,
      (select count(*)::int from staff_mfa_credentials m where m.user_id = u.id and m.is_verified) as factors,
      (select max(a.created_at) from staff_audit_log a
        where a.actor_id = u.id and a.action = 'auth.login.mfa' and a.status = 'success') as last_login
    from staff_users u
    order by u.created_at
  `;
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    isActive: r.is_active,
    forceReset: r.force_password_reset,
    factors: r.factors,
    createdAt: new Date(r.created_at).toISOString(),
    lastLogin: r.last_login ? new Date(r.last_login).toISOString() : null,
  }));
}

export type AuditItem = {
  id: string;
  createdAt: string;
  actor: string | null;
  action: string;
  status: string;
  target: string | null;
  ip: string | null;
  details: Record<string, unknown>;
};

export async function listAudit(limit = 100): Promise<AuditItem[]> {
  const rows = await sql`
    select a.id, a.created_at, actor.email as actor, a.action, a.status, a.ip, a.details,
           coalesce(target.email, a.target_id) as target
    from staff_audit_log a
    left join staff_users actor on actor.id = a.actor_id
    left join staff_users target on a.target_type = 'staff_user' and target.id::text = a.target_id
    order by a.id desc
    limit ${limit}
  `;
  return rows.map((r) => ({
    id: String(r.id),
    createdAt: new Date(r.created_at).toISOString(),
    actor: r.actor,
    action: r.action,
    status: r.status,
    target: r.target,
    ip: r.ip,
    details: r.details ?? {},
  }));
}

export function linkFor(req: Request, path: string, token: string) {
  const url = new URL(path, req.url);
  url.searchParams.set("token", token);
  return url.toString();
}
