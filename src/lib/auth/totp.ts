import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createTOTPKeyURI, generateHOTP } from "@oslojs/otp";
import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
import { authEnv } from "@/lib/auth/env";
import { safeEqual } from "@/lib/auth/tokens";

const PERIOD = 30;
const DIGITS = 6;

export type EncryptedSecret = { encrypted: string; iv: string; tag: string };

function encryptionKey() {
  return Buffer.from(authEnv().MFA_ENCRYPTION_KEY, "hex");
}

export function newTotpSecret() {
  return new Uint8Array(randomBytes(20));
}

// AES-256-GCM with the user id as associated data, so a secret copied onto
// another account's row no longer decrypts.
export function encryptSecret(secret: Uint8Array, userId: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(userId));
  const encrypted = Buffer.concat([cipher.update(secret), cipher.final()]);
  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptSecret(data: EncryptedSecret, userId: string) {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(data.iv, "base64"));
  decipher.setAAD(Buffer.from(userId));
  decipher.setAuthTag(Buffer.from(data.tag, "base64"));
  const plain = Buffer.concat([decipher.update(Buffer.from(data.encrypted, "base64")), decipher.final()]);
  return new Uint8Array(plain);
}

export function totpUri(email: string, secret: Uint8Array) {
  return createTOTPKeyURI("Aici", email, secret, PERIOD, DIGITS);
}

// The key in groups of four, for typing it into an app by hand.
export function groupedKey(secret: Uint8Array) {
  return encodeBase32UpperCaseNoPadding(secret).match(/.{1,4}/g)!.join(" ");
}

// Allows one step of clock drift either way. Returns the step that matched, so the
// caller can refuse the same code a second time.
export function matchTotp(secret: Uint8Array, code: string, now = Date.now()): number | null {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;

  const current = Math.floor(now / 1000 / PERIOD);
  let matched: number | null = null;
  for (const step of [current - 1, current, current + 1]) {
    if (safeEqual(generateHOTP(secret, BigInt(step), DIGITS), clean)) matched = step;
  }
  return matched;
}
