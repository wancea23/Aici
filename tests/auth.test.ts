import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Fixed secrets for the tests, set before any module reads them.
process.env.STAFF_PASSWORD_PEPPER = "11".repeat(32);
process.env.DATA_ENCRYPTION_KEY = "22".repeat(32);
process.env.ALTCHA_HMAC_KEY = "33".repeat(32);

const load = {
  password: () => import("../src/lib/auth/password"),
  tokens: () => import("../src/lib/auth/tokens"),
  redirect: () => import("../src/lib/auth/redirect"),
  csrf: () => import("../src/lib/auth/csrf"),
  altcha: () => import("../src/lib/auth/altcha"),
};

function withFetch(fake: typeof fetch, run: () => Promise<void>) {
  const real = globalThis.fetch;
  globalThis.fetch = fake;
  return run().finally(() => {
    globalThis.fetch = real;
  });
}

test("password rules", async () => {
  const { checkPasswordRules } = await load.password();
  assert.match(checkPasswordRules("scurta")!, /cel puțin 15/);
  assert.equal(checkPasswordRules("cal verde pe perete"), null);
  assert.match(checkPasswordRules("a".repeat(20))!, /repetat/);
  assert.match(checkPasswordRules("x".repeat(129) + "y")!, /cel mult/);
  assert.match(checkPasswordRules("ionpopescu la primarie", "ionpopescu@primaria.md")!, /email/);
  // full width letters count as normal ones after NFKC
  assert.match(checkPasswordRules("ａａａａａａａａａａａａａａａａ")!, /repetat/);
});

test("password hash round trip", async () => {
  const { hashPassword, verifyPassword, needsRehash, burnPasswordCheck } = await load.password();
  const hash = await hashPassword("cal verde pe perete");
  assert.match(hash, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  assert.equal(await verifyPassword(hash, "cal verde pe perete"), true);
  assert.equal(await verifyPassword(hash, "cal verde pe perete!"), false);
  assert.equal(needsRehash(hash), false);
  assert.equal(needsRehash("$argon2id$v=19$m=4096,t=3,p=1$c29tZXNhbHQ$aGFzaA"), true);
  assert.equal(await burnPasswordCheck("orice"), false);
});

test("breached password check", async () => {
  const { isBreached, validateNewPassword } = await load.password();
  const pw = "cal verde pe perete";
  const suffix = createHash("sha1").update(pw).digest("hex").toUpperCase().slice(5);
  const answer = (body: string) => async () => new Response(body);

  await withFetch(answer(`${suffix}:12\r\nAAAA:1`), async () => {
    assert.equal(await isBreached(pw), true);
  });
  // padding lines carry a count of 0 and must not count as a hit
  await withFetch(answer(`${suffix}:0\r\nAAAA:1`), async () => {
    assert.equal(await isBreached(pw), false);
  });
  // if the service can't be reached, the password is refused
  await withFetch(
    async () => {
      throw new Error("offline");
    },
    async () => {
      assert.match((await validateNewPassword(pw))!, /Nu am putut verifica/);
    }
  );
});

test("tokens", async () => {
  const { newToken, sha256, safeEqual } = await load.tokens();
  const a = newToken();
  const b = newToken();
  assert.match(a.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(a.hash, sha256(a.token));
  assert.notEqual(a.token, b.token);
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
});

test("safeNext keeps redirects on this site", async () => {
  const { safeNext } = await load.redirect();
  assert.equal(safeNext("/admin?x=1"), "/admin?x=1");
  assert.equal(safeNext(undefined), "/panou");
  assert.equal(safeNext("https://evil.example"), "/panou");
  assert.equal(safeNext("//evil.example"), "/panou");
  assert.equal(safeNext("/\\evil.example"), "/panou");
  assert.equal(safeNext("/\t/evil.example"), "/panou");
  assert.equal(safeNext("/\n/evil.example"), "/panou");
});

test("sameOrigin", async () => {
  const { sameOrigin } = await load.csrf();
  const req = (headers: Record<string, string>) => ({ headers: new Headers(headers) }) as unknown as Request;
  assert.equal(sameOrigin(req({ origin: "http://localhost:3000", host: "localhost:3000" })), true);
  assert.equal(sameOrigin(req({ origin: "https://evil.example", host: "localhost:3000" })), false);
  assert.equal(sameOrigin(req({ host: "localhost:3000" })), false);
  assert.equal(sameOrigin(req({ origin: "null", host: "localhost:3000" })), false);
  assert.equal(
    sameOrigin(req({ origin: "http://localhost:3000", host: "localhost:3000", "sec-fetch-site": "cross-site" })),
    false
  );
});

test("ALTCHA rejects junk and unsolved payloads", async () => {
  const { newChallenge, verifyAltcha } = await load.altcha();
  assert.equal(await verifyAltcha(undefined), false);
  assert.equal(await verifyAltcha("not base64 json"), false);
  const challenge = await newChallenge();
  const unsolved = Buffer.from(
    JSON.stringify({ challenge, solution: { counter: 1, derivedKey: "00" } })
  ).toString("base64");
  assert.equal(await verifyAltcha(unsolved), false);
});
