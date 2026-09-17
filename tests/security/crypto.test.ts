import { test } from "node:test";
import assert from "node:assert/strict";

// Fixed secrets for the tests, set before any module reads them.
process.env.STAFF_PASSWORD_PEPPER = "11".repeat(32);
process.env.DATA_ENCRYPTION_KEY = "22".repeat(32);
process.env.ALTCHA_HMAC_KEY = "33".repeat(32);

const load = () => import("../../src/server/security/crypto");

test("text round trip, bound to its report and field", async () => {
  const { encryptText, decryptText, isEncryptedText } = await load();
  const ctx = "report:1:description";
  const sealed = encryptText("Groapă adâncă lângă stație", ctx);

  assert.equal(isEncryptedText(sealed), true);
  assert.ok(!sealed.includes("Groap"));
  assert.equal(decryptText(sealed, ctx), "Groapă adâncă lângă stație");
  // a fresh IV every time, so equal texts don't look equal in the database
  assert.notEqual(encryptText("x", ctx), encryptText("x", ctx));
  // copied to another report or another column, it no longer opens
  assert.throws(() => decryptText(sealed, "report:2:description"));
  assert.throws(() => decryptText(sealed, "report:1:location"));
  assert.equal(decryptText(encryptText("", ctx), ctx), "");
});

test("rows from before encryption pass through unchanged", async () => {
  const { decryptText, decryptBytes } = await load();
  assert.equal(decryptText("text vechi", "report:1:description"), "text vechi");
  const webp = Buffer.from("RIFF0000WEBPVP8 ");
  assert.equal(decryptBytes(webp, "report:1:photo"), webp);
});

test("photo bytes round trip and tamper detection", async () => {
  const { encryptBytes, decryptBytes, isEncryptedBytes } = await load();
  const photo = Buffer.from("RIFF" + "x".repeat(100));
  const sealed = encryptBytes(photo, "report:1:photo");

  assert.equal(isEncryptedBytes(sealed), true);
  assert.deepEqual(decryptBytes(sealed, "report:1:photo"), photo);

  const tampered = Buffer.from(sealed);
  tampered[tampered.length - 1] ^= 1;
  assert.throws(() => decryptBytes(tampered, "report:1:photo"));
  assert.throws(() => decryptBytes(sealed, "report:2:photo"));
});
