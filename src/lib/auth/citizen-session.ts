import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import sql from "@/lib/db";
import { CITIZEN_COOKIE } from "@/lib/auth/cookie";
import { newToken, sha256 } from "@/lib/auth/tokens";
import { decryptText } from "@/lib/crypto";

export type Citizen = { id: string; email: string };

// A citizen can do much less than staff, so the session lasts longer:
// a week without activity or 30 days in total.
const IDLE_SEC = 7 * 24 * 60 * 60;
const ABSOLUTE_SEC = 30 * 24 * 60 * 60;

const tokenShape = /^[A-Za-z0-9_-]{43}$/;

async function setCookie(value: string, maxAge: number) {
  (await cookies()).set(CITIZEN_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function startCitizenSession(userId: string) {
  const { token, hash } = newToken();
  await sql`
    delete from citizen_sessions
    where user_id = ${userId} and (expires_at <= now() or idle_expires_at <= now())
  `;
  await sql`
    insert into citizen_sessions (user_id, token_hash, idle_expires_at, expires_at)
    values (${userId}, ${hash}, now() + ${IDLE_SEC}::int * interval '1 second',
            now() + ${ABSOLUTE_SEC}::int * interval '1 second')
  `;
  await setCookie(token, ABSOLUTE_SEC);
}

// Overwritten instead of deleted, same as the staff cookie.
export async function endCitizenSession() {
  const token = (await cookies()).get(CITIZEN_COOKIE)?.value;
  if (token && tokenShape.test(token)) {
    await sql`delete from citizen_sessions where token_hash = ${sha256(token)}`;
  }
  await setCookie("", 0);
}

// Checked against the database on every request, once per render thanks to cache().
export const currentCitizen = cache(async (): Promise<Citizen | null> => {
  const token = (await cookies()).get(CITIZEN_COOKIE)?.value;
  if (!token || !tokenShape.test(token)) return null;

  const [row] = await sql`
    select s.id, s.last_active_at < now() - interval '1 hour' as stale, u.id as user_id, u.email
    from citizen_sessions s
    join citizen_users u on u.id = s.user_id
    where s.token_hash = ${sha256(token)} and s.expires_at > now() and s.idle_expires_at > now()
  `;
  if (!row) return null;

  // The idle timer slides, but the row is written at most once an hour.
  if (row.stale) {
    await sql`
      update citizen_sessions
      set last_active_at = now(),
          idle_expires_at = least(now() + ${IDLE_SEC}::int * interval '1 second', expires_at)
      where id = ${row.id}
    `;
  }
  return { id: row.user_id, email: decryptText(row.email, `citizen:${row.user_id}:email`) };
});
