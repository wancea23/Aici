import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import sql from "@/server/db/owner";
import { CITIZEN_COOKIE } from "@/server/security/cookie";
import { newToken, sha256 } from "@/server/security/tokens";
import { decryptText } from "@/server/security/crypto";
import { ABSOLUTE_SEC, IDLE_SEC, REFRESH_SEC } from "@/features/citizens/session-policy";

export type Citizen = { id: string; email: string };

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
    select s.id, s.last_active_at < now() - ${REFRESH_SEC}::int * interval '1 second' as stale,
           u.id as user_id, u.email
    from citizen_sessions s
    join citizen_users u on u.id = s.user_id
    where s.token_hash = ${sha256(token)} and s.expires_at > now() and s.idle_expires_at > now()
  `;
  if (!row) return null;

  // The idle timer slides, but the row is written at most every 5 minutes.
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
