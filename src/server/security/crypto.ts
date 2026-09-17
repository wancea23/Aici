import "server-only";
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";
import { serverEnv } from "@/server/env";

// Citizen data is encrypted by the app with a key that never goes into the database,
// so a dump, a backup or an SQL injection only gets ciphertext. The context (report id
// and field) is bound in as associated data: a value copied to another row or column
// no longer decrypts.

const TEXT_PREFIX = "enc:v1:";
const BYTES_VERSION = 1;

function key() {
  return Buffer.from(serverEnv().DATA_ENCRYPTION_KEY, "hex");
}

// An encrypted email can't be searched, so each one also gets a keyed hash to look it up by.
// Its key is derived from the data key, so there is no extra secret to pass around.
let indexKey: Buffer | null = null;

export function emailIndex(email: string) {
  indexKey ??= Buffer.from(hkdfSync("sha256", key(), Buffer.alloc(0), "aici email index", 32));
  return createHmac("sha256", indexKey).update(email.trim().toLowerCase()).digest("hex");
}

function seal(plain: Buffer, context: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(context));
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return { iv, tag: cipher.getAuthTag(), body };
}

function open(iv: Buffer, tag: Buffer, body: Buffer, context: string) {
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]);
}

export function isEncryptedText(value: string) {
  return value.startsWith(TEXT_PREFIX);
}

export function encryptText(plain: string, context: string) {
  const { iv, tag, body } = seal(Buffer.from(plain, "utf8"), context);
  return TEXT_PREFIX + [iv, tag, body].map((part) => part.toString("base64")).join(".");
}

// Rows saved before encryption come back as they are, until the migration has run.
export function decryptText(value: string, context: string) {
  if (!isEncryptedText(value)) return value;
  const [iv, tag, body] = value
    .slice(TEXT_PREFIX.length)
    .split(".")
    .map((part) => Buffer.from(part, "base64"));
  return open(iv, tag, body, context).toString("utf8");
}

// A webp starts with "RIFF", so a first byte of 1 can only mean our own format.
export function isEncryptedBytes(value: Uint8Array) {
  return value[0] === BYTES_VERSION;
}

export function encryptBytes(plain: Buffer, context: string) {
  const { iv, tag, body } = seal(plain, context);
  return Buffer.concat([Buffer.from([BYTES_VERSION]), iv, tag, body]);
}

export function decryptBytes(value: Buffer, context: string) {
  if (!isEncryptedBytes(value)) return value;
  return open(value.subarray(1, 13), value.subarray(13, 29), value.subarray(29), context);
}
