import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Fixed secrets for the tests, set before any module reads them.
process.env.STAFF_PASSWORD_PEPPER = "11".repeat(32);
process.env.DATA_ENCRYPTION_KEY = "22".repeat(32);
process.env.ALTCHA_HMAC_KEY = "33".repeat(32);
process.env.APP_URL = "https://aici.example/";
process.env.SMTP_HOST = "";

const load = {
  crypto: () => import("../src/lib/crypto"),
  env: () => import("../src/lib/env"),
  mail: () => import("../src/lib/mail"),
  redirect: () => import("../src/lib/auth/redirect"),
};

test("email index ignores case and spaces, and needs the key", async () => {
  const { emailIndex } = await load.crypto();
  const index = emailIndex("Ion.Popescu@Mail.md");
  assert.match(index, /^[0-9a-f]{64}$/);
  assert.equal(emailIndex("  ion.popescu@mail.md "), index);
  assert.notEqual(emailIndex("ion.popescu2@mail.md"), index);
  // a plain hash could be matched against a list of known addresses
  assert.notEqual(index, createHash("sha256").update("ion.popescu@mail.md").digest("hex"));
});

test("blank email settings count as missing", async () => {
  const { mailEnv } = await load.env();
  assert.equal(mailEnv().SMTP_HOST, undefined);
  assert.equal(mailEnv().SMTP_PORT, 465);
});

test("email links use APP_URL, not the Host of the request", async () => {
  const { appUrl } = await load.mail();
  assert.equal(appUrl(new Request("http://evil.example/api/citizen/register")), "https://aici.example");
});

test("sign up mails", async () => {
  const { signupMail, existingAccountMail } = await load.mail();
  const link = "https://aici.example/verificare?token=abc";
  const first = signupMail("ion@mail.md", link);
  assert.equal(first.to, "ion@mail.md");
  assert.ok(first.text.includes(link));
  // the mail for a taken address carries no token, only the way to sign in
  const again = existingAccountMail("ion@mail.md", "https://aici.example");
  assert.ok(again.text.includes("https://aici.example/conectare"));
  assert.ok(!again.text.includes("token"));
});

test("without SMTP, development prints the mail instead", async () => {
  const { sendMail } = await load.mail();
  const printed: string[] = [];
  const real = console.log;
  console.log = (line: string) => printed.push(line);
  try {
    await sendMail({ to: "ion@mail.md", subject: "Test", text: "https://aici.example/x" });
  } finally {
    console.log = real;
  }
  assert.ok(printed.join("\n").includes("ion@mail.md"));
});

test("citizen password rules", async () => {
  const { checkPasswordRules } = await import("../src/lib/auth/password");
  assert.equal(checkPasswordRules("Parola!1", "ion@mail.md", "citizen"), null);
  assert.match(checkPasswordRules("Pa!1", undefined, "citizen")!, /8 caractere/);
  assert.match(checkPasswordRules("parola!12", undefined, "citizen")!, /literă mare/);
  assert.match(checkPasswordRules("PAROLA!12", undefined, "citizen")!, /literă mică/);
  assert.match(checkPasswordRules("Parola123", undefined, "citizen")!, /caracter special/);
  // every missing rule is named at once
  assert.match(checkPasswordRules("parola", undefined, "citizen")!, /8 caractere, o literă mare, un caracter special/);
  // staff keep the 15 character minimum
  assert.match(checkPasswordRules("Parola!1")!, /15/);
});

test("citizen login sends people home by default", async () => {
  const { safeNext } = await load.redirect();
  assert.equal(safeNext(undefined, "/"), "/");
  assert.equal(safeNext("//evil.example", "/"), "/");
  assert.equal(safeNext("/profil", "/"), "/profil");
});
