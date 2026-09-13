import "server-only";
import { CappedMap, createChallenge, randomInt, verifySolution, type Payload } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";
import { serverEnv } from "@/lib/env";

// Signatures already accepted, so one solved puzzle can't be replayed.
const used = new CappedMap<string, true>({ maxSize: 10_000 });

// Proof of work instead of a third party captcha: nothing about the visitor leaves our server.
export function newChallenge() {
  return createChallenge({
    algorithm: "PBKDF2/SHA-256",
    cost: 5000,
    counter: randomInt(5000, 10000),
    deriveKey,
    hmacSignatureSecret: serverEnv().ALTCHA_HMAC_KEY,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
}

// The widget sends base64 JSON holding the signed challenge and the counter it found.
export async function verifyAltcha(payload: unknown): Promise<boolean> {
  if (typeof payload !== "string" || payload.length > 4096) return false;

  let data: Payload;
  try {
    data = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
  } catch {
    return false;
  }

  const signature = data?.challenge?.signature;
  if (typeof signature !== "string" || !data.solution || used.has(signature)) return false;
  used.set(signature, true);

  try {
    const result = await verifySolution({
      challenge: data.challenge,
      solution: data.solution,
      deriveKey,
      hmacSignatureSecret: serverEnv().ALTCHA_HMAC_KEY,
    });
    return result.verified && !result.expired;
  } catch {
    return false;
  }
}
