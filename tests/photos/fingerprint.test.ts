import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesFingerprint, photoFingerprint, reprDigest } from "../../src/features/photos/fingerprint";

const abc = Buffer.from("abc");
const abcHash = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

test("fingerprint is the SHA-256 of the bytes", () => {
  assert.equal(photoFingerprint(abc), abcHash);
});

test("a changed photo no longer matches", () => {
  assert.equal(matchesFingerprint(abc, abcHash), true);
  assert.equal(matchesFingerprint(Buffer.from("abd"), abcHash), false);
});

test("old photos without a fingerprint still pass", () => {
  assert.equal(matchesFingerprint(abc, null), true);
});

test("Repr-Digest carries the hash in base64", () => {
  assert.equal(reprDigest(abcHash), "sha-256=:ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=:");
});
