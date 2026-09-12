import "server-only";
import sql from "@/lib/db";
import { decryptSecret, encryptSecret, matchTotp, newTotpSecret } from "@/lib/auth/totp";
import { hashRecoveryCode, newRecoveryCodes, normalizeRecoveryCode } from "@/lib/auth/recovery";

export type FactorType = "totp" | "webauthn";

export type Factor = {
  id: string;
  type: FactorType;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export async function listFactors(userId: string): Promise<Factor[]> {
  const rows = await sql`
    select id, mfa_type, label, created_at, last_used_at
    from staff_mfa_credentials
    where user_id = ${userId} and is_verified
    order by created_at
  `;
  return rows.map((r) => ({
    id: r.id,
    type: r.mfa_type,
    label: r.label,
    createdAt: new Date(r.created_at).toISOString(),
    lastUsedAt: r.last_used_at ? new Date(r.last_used_at).toISOString() : null,
  }));
}

// A new TOTP secret that only counts once the user proves it with a code.
// An earlier setup that was never finished is dropped.
export async function startTotpSetup(userId: string) {
  const secret = newTotpSecret();
  const enc = encryptSecret(secret, userId);
  const id = await sql.begin(async (tx) => {
    await tx`delete from staff_mfa_credentials where user_id = ${userId} and mfa_type = 'totp' and not is_verified`;
    const [row] = await tx`
      insert into staff_mfa_credentials (user_id, mfa_type, label, encrypted_secret, secret_iv, secret_tag)
      values (${userId}, 'totp', 'Aplicație de autentificare', ${enc.encrypted}, ${enc.iv}, ${enc.tag})
      returning id
    `;
    return row.id as string;
  });
  return { id, secret };
}

// Checks a code against the user's TOTP (or against one row being set up). The step
// update refuses a code that was already accepted once.
export async function checkTotp(userId: string, code: string, pendingId?: string): Promise<string | null> {
  const rows = pendingId
    ? await sql`
        select id, encrypted_secret, secret_iv, secret_tag from staff_mfa_credentials
        where id = ${pendingId} and user_id = ${userId} and mfa_type = 'totp' and not is_verified
      `
    : await sql`
        select id, encrypted_secret, secret_iv, secret_tag from staff_mfa_credentials
        where user_id = ${userId} and mfa_type = 'totp' and is_verified
      `;

  for (const row of rows) {
    const secret = decryptSecret(
      { encrypted: row.encrypted_secret, iv: row.secret_iv, tag: row.secret_tag },
      userId
    );
    const step = matchTotp(secret, code);
    if (step === null) continue;

    const accepted = await sql`
      update staff_mfa_credentials
      set totp_last_step = ${step}, last_used_at = now(), is_verified = true
      where id = ${row.id} and (totp_last_step is null or totp_last_step < ${step})
      returning id
    `;
    if (accepted.length) return row.id;
  }
  return null;
}

export async function hasVerifiedTotp(userId: string) {
  const [row] = await sql`
    select 1 from staff_mfa_credentials where user_id = ${userId} and mfa_type = 'totp' and is_verified
  `;
  return Boolean(row);
}

export async function redeemRecoveryCode(userId: string, code: string) {
  if (normalizeRecoveryCode(code).length !== 16) return false;
  const rows = await sql`
    update staff_recovery_codes set used_at = now()
    where user_id = ${userId} and code_hash = ${hashRecoveryCode(code)} and used_at is null
    returning id
  `;
  return rows.length > 0;
}

// New codes replace all old ones. Only the hashes are stored, the codes are shown once.
export async function replaceRecoveryCodes(userId: string) {
  const codes = newRecoveryCodes();
  const rows = codes.map((code) => ({ user_id: userId, code_hash: hashRecoveryCode(code) }));
  await sql.begin(async (tx) => {
    await tx`delete from staff_recovery_codes where user_id = ${userId}`;
    await tx`insert into staff_recovery_codes ${tx(rows, "user_id", "code_hash")}`;
  });
  return codes;
}

export async function recoveryCodesLeft(userId: string) {
  const [row] = await sql`
    select count(*)::int as n from staff_recovery_codes where user_id = ${userId} and used_at is null
  `;
  return row.n as number;
}

// Refuses to remove the last working factor. The user row is locked so two removals
// running at once can't both pass the count.
export async function deleteFactor(userId: string, factorId: string): Promise<FactorType | "last" | null> {
  return sql.begin(async (tx) => {
    await tx`select id from staff_users where id = ${userId} for update`;
    const [factor] = await tx`
      select mfa_type, is_verified from staff_mfa_credentials where id = ${factorId} and user_id = ${userId}
    `;
    if (!factor) return null;
    if (factor.is_verified) {
      const [{ n }] = await tx`
        select count(*)::int as n from staff_mfa_credentials where user_id = ${userId} and is_verified
      `;
      if (n <= 1) return "last";
    }
    await tx`delete from staff_mfa_credentials where id = ${factorId}`;
    return factor.mfa_type as FactorType;
  });
}
