import { createHash } from "node:crypto";

// SHA-256 of the cleaned photo, taken when it arrives. Staff can quote it to show that the
// photo they have is exactly the one the citizen sent, and the media route checks it again
// before every download.
export function photoFingerprint(data: Uint8Array) {
  return createHash("sha256").update(data).digest("hex");
}

// Photos saved before fingerprints existed have none, so there is nothing to compare.
export function matchesFingerprint(data: Uint8Array, expected: string | null) {
  return expected === null || photoFingerprint(data) === expected;
}

// The Repr-Digest header from RFC 9530, so a downloaded copy can be checked too.
export function reprDigest(hex: string) {
  return `sha-256=:${Buffer.from(hex, "hex").toString("base64")}:`;
}
