import "server-only";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import sql from "@/lib/db";
import { authEnv } from "@/lib/auth/env";

type Purpose = "login" | "register";

// The challenge sits on the session row for 5 minutes and is tied to what it was made for.
async function storeChallenge(sessionId: string, purpose: Purpose, challenge: string) {
  await sql`
    update staff_sessions
    set challenge = ${`${purpose}:${challenge}`}, challenge_expires_at = now() + interval '5 minutes'
    where id = ${sessionId}
  `;
}

// Read and cleared in one statement, so a challenge can only ever be answered once.
async function takeChallenge(sessionId: string, purpose: Purpose): Promise<string | null> {
  const [row] = await sql`
    with old as (
      select id, challenge, challenge_expires_at > now() as fresh
      from staff_sessions where id = ${sessionId} for update
    )
    update staff_sessions s set challenge = null, challenge_expires_at = null
    from old where s.id = old.id
    returning old.challenge, old.fresh
  `;
  if (!row?.challenge || !row.fresh) return null;
  const prefix = `${purpose}:`;
  return row.challenge.startsWith(prefix) ? row.challenge.slice(prefix.length) : null;
}

function uuidBytes(id: string) {
  return new Uint8Array(Buffer.from(id.replace(/-/g, ""), "hex"));
}

async function passkeysOf(userId: string) {
  const rows = await sql`
    select webauthn_credential_id, webauthn_transports from staff_mfa_credentials
    where user_id = ${userId} and mfa_type = 'webauthn' and is_verified
  `;
  return rows.map((r) => ({
    id: r.webauthn_credential_id as string,
    transports: (r.webauthn_transports ?? undefined) as string[] | undefined,
  }));
}

export async function registrationOptions(sessionId: string, user: { id: string; email: string }) {
  const options = await generateRegistrationOptions({
    rpName: "Aici",
    rpID: authEnv().WEBAUTHN_RP_ID,
    userName: user.email,
    userID: uuidBytes(user.id),
    attestationType: "none",
    excludeCredentials: await passkeysOf(user.id),
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
  });
  await storeChallenge(sessionId, "register", options.challenge);
  return options;
}

export async function verifyRegistration(
  sessionId: string,
  userId: string,
  response: RegistrationResponseJSON,
  label: string
): Promise<string | null> {
  const expectedChallenge = await takeChallenge(sessionId, "register");
  if (!expectedChallenge) return null;

  const { WEBAUTHN_RP_ID, WEBAUTHN_ORIGIN } = authEnv();
  try {
    // User verification is not required: the passkey is the second factor, the password was the first.
    const result = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: WEBAUTHN_ORIGIN,
      expectedRPID: WEBAUTHN_RP_ID,
      requireUserVerification: false,
    });
    if (!result.verified) return null;

    const { credential } = result.registrationInfo;
    const [row] = await sql`
      insert into staff_mfa_credentials
        (user_id, mfa_type, label, webauthn_credential_id, webauthn_public_key, webauthn_counter,
         webauthn_transports, is_verified)
      values
        (${userId}, 'webauthn', ${label}, ${credential.id}, ${Buffer.from(credential.publicKey)},
         ${credential.counter}, ${credential.transports ? sql.array(credential.transports) : null}, true)
      returning id
    `;
    return row.id;
  } catch (err) {
    console.error("passkey registration failed", err);
    return null;
  }
}

export async function authenticationOptions(sessionId: string, userId: string) {
  const allowCredentials = await passkeysOf(userId);
  if (!allowCredentials.length) return null;

  const options = await generateAuthenticationOptions({
    rpID: authEnv().WEBAUTHN_RP_ID,
    allowCredentials,
    userVerification: "preferred",
  });
  await storeChallenge(sessionId, "login", options.challenge);
  return options;
}

export async function verifyAuthentication(
  sessionId: string,
  userId: string,
  response: AuthenticationResponseJSON
): Promise<string | null> {
  const expectedChallenge = await takeChallenge(sessionId, "login");
  if (!expectedChallenge) return null;

  const [cred] = await sql`
    select id, webauthn_credential_id, webauthn_public_key, webauthn_counter, webauthn_transports
    from staff_mfa_credentials
    where user_id = ${userId} and mfa_type = 'webauthn' and is_verified
      and webauthn_credential_id = ${response.id}
  `;
  if (!cred) return null;

  const { WEBAUTHN_RP_ID, WEBAUTHN_ORIGIN } = authEnv();
  try {
    const result = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: WEBAUTHN_ORIGIN,
      expectedRPID: WEBAUTHN_RP_ID,
      credential: {
        id: cred.webauthn_credential_id,
        publicKey: new Uint8Array(cred.webauthn_public_key),
        // bigint columns come back as strings
        counter: Number(cred.webauthn_counter),
        transports: cred.webauthn_transports ?? undefined,
      },
      requireUserVerification: false,
    });
    if (!result.verified) return null;

    await sql`
      update staff_mfa_credentials
      set webauthn_counter = ${result.authenticationInfo.newCounter}, last_used_at = now()
      where id = ${cred.id}
    `;
    return cred.id;
  } catch (err) {
    console.error("passkey login failed", err);
    return null;
  }
}
