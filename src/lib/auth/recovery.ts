import "server-only";
import { randomBytes } from "node:crypto";
import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
import { sha256 } from "@/lib/auth/tokens";

export const RECOVERY_CODE_COUNT = 10;

// 80 random bits each, shown as XXXX-XXXX-XXXX-XXXX.
export function newRecoveryCodes(count = RECOVERY_CODE_COUNT) {
  return Array.from({ length: count }, () =>
    encodeBase32UpperCaseNoPadding(randomBytes(10)).match(/.{4}/g)!.join("-")
  );
}

// Case, spaces and dashes don't matter when a code is typed back in.
export function normalizeRecoveryCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z2-7]/g, "");
}

export function hashRecoveryCode(code: string) {
  return sha256(normalizeRecoveryCode(code));
}
