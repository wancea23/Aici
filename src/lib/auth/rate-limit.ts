import "server-only";
import sql from "@/lib/db";

export type Rule = {
  name: string;
  windowSec: number;
  max: number;
  // after this many failures each new one doubles the wait, up to 15 minutes
  backoffAfter?: number;
  // after this many failures the login form asks for an ALTCHA
  challengeAfter?: number;
};

// Slowing down instead of locking out, so nobody can lock a colleague out on purpose.
export const rules = {
  loginIp: { name: "login-ip", windowSec: 15 * 60, max: 50, challengeAfter: 20 },
  loginAccount: { name: "login-account", windowSec: 60 * 60, max: 100, backoffAfter: 5, challengeAfter: 10 },
  password: { name: "password", windowSec: 15 * 60, max: 20, backoffAfter: 3 },
  tokenIp: { name: "token-ip", windowSec: 15 * 60, max: 30 },
  reportIp: { name: "report-ip", windowSec: 60 * 60, max: 20 },
} satisfies Record<string, Rule>;

export type LimitState = { blocked: boolean; retryAfter: number; needsChallenge: boolean };

const rateKey = (rule: Rule, id: string) => `${rule.name}:${id}`;

export async function peek(rule: Rule, id: string): Promise<LimitState> {
  const [row] = await sql<{ attempts: number; backoff: number; window_left: number }[]>`
    select
      case when first_attempt_at > now() - ${rule.windowSec}::int * interval '1 second'
           then attempts else 0 end as attempts,
      greatest(0, ceil(extract(epoch from (coalesce(next_allowed_at, now()) - now()))))::int as backoff,
      greatest(0, ceil(extract(epoch from
        (first_attempt_at + ${rule.windowSec}::int * interval '1 second' - now()))))::int as window_left
    from staff_rate_limits
    where rate_key = ${rateKey(rule, id)}
  `;
  if (!row) return { blocked: false, retryAfter: 0, needsChallenge: false };
  if (row.attempts >= rule.max) {
    return { blocked: true, retryAfter: Math.max(1, row.window_left), needsChallenge: false };
  }
  if (row.backoff > 0) return { blocked: true, retryAfter: row.backoff, needsChallenge: false };
  return {
    blocked: false,
    retryAfter: 0,
    needsChallenge: rule.challengeAfter !== undefined && row.attempts >= rule.challengeAfter,
  };
}

export async function recordFailure(rule: Rule, id: string) {
  const key = rateKey(rule, id);
  const [row] = await sql<{ attempts: number }[]>`
    insert into staff_rate_limits (rate_key, attempts, first_attempt_at, last_attempt_at)
    values (${key}, 1, now(), now())
    on conflict (rate_key) do update set
      attempts = case
        when staff_rate_limits.first_attempt_at <= now() - ${rule.windowSec}::int * interval '1 second' then 1
        else staff_rate_limits.attempts + 1 end,
      first_attempt_at = case
        when staff_rate_limits.first_attempt_at <= now() - ${rule.windowSec}::int * interval '1 second' then now()
        else staff_rate_limits.first_attempt_at end,
      last_attempt_at = now()
    returning attempts
  `;

  if (rule.backoffAfter !== undefined && row.attempts >= rule.backoffAfter) {
    const wait = Math.min(2 ** (row.attempts - rule.backoffAfter + 1), 900);
    await sql`
      update staff_rate_limits set next_allowed_at = now() + ${wait}::int * interval '1 second'
      where rate_key = ${key}
    `;
  }

  // Old rows are cleared now and then instead of by a scheduled job.
  if (Math.random() < 0.02) {
    await sql`
      delete from staff_rate_limits
      where last_attempt_at < now() - interval '1 day'
        and (next_allowed_at is null or next_allowed_at < now())
    `;
  }

  return row.attempts;
}

// For limits that count every request, not only the failed ones.
export const countAttempt = recordFailure;

export function challengeDue(rule: Rule, attempts: number) {
  return rule.challengeAfter !== undefined && attempts >= rule.challengeAfter;
}

export async function clearLimit(rule: Rule, id: string) {
  await sql`delete from staff_rate_limits where rate_key = ${rateKey(rule, id)}`;
}
