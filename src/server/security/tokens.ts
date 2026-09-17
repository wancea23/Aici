import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

// 256 random bits. The raw token goes to the browser, only its hash to the database,
// so a leaked database can't be turned back into working cookies or links.
export function newToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: sha256(token) };
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
