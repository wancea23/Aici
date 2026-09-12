import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import sql from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth/cookie";
import { newToken, sha256 } from "@/lib/auth/tokens";
import type { ClientInfo } from "@/lib/auth/request";

export type Role = "operator" | "admin";

export type StaffUser = {
  id: string;
  email: string;
  role: Role;
  forcePasswordReset: boolean;
};

export type Session = {
  id: string;
  mfaVerified: boolean;
  expiresAt: Date;
};

export type SessionResult = { session: Session; user: StaffUser };

type Db = typeof sql;

// A session after the password only reaches the MFA step, and only for 10 minutes.
const PENDING_SEC = 10 * 60;
const IDLE_SEC = 30 * 60;
const ABSOLUTE_SEC = 12 * 60 * 60;

const tokenShape = /^[A-Za-z0-9_-]{43}$/;

async function insertSession(
  db: Db,
  userId: string,
  mfaVerified: boolean,
  client: ClientInfo,
  keepExpiresAt?: Date
) {
  const { token, hash } = newToken();
  const life = mfaVerified ? ABSOLUTE_SEC : PENDING_SEC;
  const idle = mfaVerified ? IDLE_SEC : PENDING_SEC;
  const [row] = await db<{ expires_at: Date }[]>`
    with t as (
      select coalesce(${keepExpiresAt ?? null}::timestamptz, now() + ${life}::int * interval '1 second') as expires_at
    )
    insert into staff_sessions (user_id, token_hash, mfa_verified, ip, user_agent, idle_expires_at, expires_at)
    select ${userId}, ${hash}, ${mfaVerified}, ${client.ip}, ${client.userAgent},
           least(now() + ${idle}::int * interval '1 second', t.expires_at), t.expires_at
    from t
    returning expires_at
  `;
  return { token, expiresAt: new Date(row.expires_at) };
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
  });
}

// Overwritten with the same flags rather than deleted, or browsers keep a __Host- cookie.
export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

// Right after a correct password.
export async function startPendingSession(userId: string, client: ClientInfo) {
  await sql`
    delete from staff_sessions
    where user_id = ${userId} and (expires_at <= now() or idle_expires_at <= now())
  `;
  const { token, expiresAt } = await insertSession(sql, userId, false, client);
  await setSessionCookie(token, expiresAt);
}

// After the second factor: the pending session is thrown away and a new token is issued,
// so a token seen before login is worth nothing afterwards.
export async function upgradeSession(pendingId: string, userId: string, client: ClientInfo) {
  const { token, expiresAt } = await sql.begin(async (tx) => {
    await tx`delete from staff_sessions where id = ${pendingId}`;
    return insertSession(tx as unknown as Db, userId, true, client);
  });
  await setSessionCookie(token, expiresAt);
}

// After a password change: every other device is signed out and this one gets a fresh
// token, without stretching the 12 hour limit.
export async function replaceAllSessions(userId: string, client: ClientInfo, keepExpiresAt: Date) {
  const { token, expiresAt } = await sql.begin(async (tx) => {
    await tx`delete from staff_sessions where user_id = ${userId}`;
    return insertSession(tx as unknown as Db, userId, true, client, keepExpiresAt);
  });
  await setSessionCookie(token, expiresAt);
}

export async function deleteCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token && tokenShape.test(token)) {
    await sql`delete from staff_sessions where token_hash = ${sha256(token)}`;
  }
}

async function validateSessionToken(token: string): Promise<SessionResult | null> {
  if (!tokenShape.test(token)) return null;

  const [row] = await sql`
    select s.id, s.mfa_verified, s.expires_at,
           s.last_active_at < now() - interval '5 minutes' as stale,
           u.id as user_id, u.email, u.role, u.force_password_reset
    from staff_sessions s
    join staff_users u on u.id = s.user_id
    where s.token_hash = ${sha256(token)}
      and s.expires_at > now()
      and s.idle_expires_at > now()
      and u.is_active
  `;
  if (!row) return null;

  // The idle timer slides, but the row is written at most every 5 minutes.
  if (row.mfa_verified && row.stale) {
    await sql`
      update staff_sessions
      set last_active_at = now(),
          idle_expires_at = least(now() + ${IDLE_SEC}::int * interval '1 second', expires_at)
      where id = ${row.id}
    `;
  }

  return {
    session: { id: row.id, mfaVerified: row.mfa_verified, expiresAt: new Date(row.expires_at) },
    user: {
      id: row.user_id,
      email: row.email,
      role: row.role,
      forcePasswordReset: row.force_password_reset,
    },
  };
}

// Checked against the database on every request, once per render thanks to cache().
export const currentSession = cache(async (): Promise<SessionResult | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? validateSessionToken(token) : null;
});
