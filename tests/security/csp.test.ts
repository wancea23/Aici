import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCsp, newNonce } from "../../src/server/security/csp";

const directive = (csp: string, name: string) =>
  csp.split("; ").find((d) => d.startsWith(`${name} `))?.slice(name.length + 1).split(" ") ?? [];

test("scripts only run with the nonce of this response", () => {
  const csp = buildCsp("abc123", false);
  const scripts = directive(csp, "script-src");
  assert.ok(scripts.includes("'nonce-abc123'"));
  assert.ok(!scripts.includes("'unsafe-inline'"));
  assert.ok(!scripts.includes("'unsafe-eval'"));
  assert.ok(!scripts.includes("*"));
});

test("inline styles only as attributes, <style> tags need the nonce", () => {
  const csp = buildCsp("abc123", false);
  for (const name of ["style-src", "style-src-elem"]) {
    assert.ok(!directive(csp, name).includes("'unsafe-inline'"), name);
    assert.ok(directive(csp, name).includes("'nonce-abc123'"), name);
  }
  assert.deepEqual(directive(csp, "style-src-attr"), ["'unsafe-inline'"]);
});

test("eval is allowed in development only", () => {
  assert.ok(directive(buildCsp("n", true), "script-src").includes("'unsafe-eval'"));
  assert.ok(!directive(buildCsp("n", false), "script-src").includes("'unsafe-eval'"));
});

test("no framing, no plugins, no foreign forms or base", () => {
  const csp = buildCsp("n", false);
  assert.deepEqual(directive(csp, "frame-ancestors"), ["'none'"]);
  assert.deepEqual(directive(csp, "object-src"), ["'none'"]);
  assert.deepEqual(directive(csp, "form-action"), ["'self'"]);
  assert.deepEqual(directive(csp, "base-uri"), ["'self'"]);
  assert.deepEqual(directive(csp, "default-src"), ["'self'"]);
});

test("a fresh nonce every time", () => {
  const a = newNonce();
  const b = newNonce();
  assert.notEqual(a, b);
  assert.equal(Buffer.from(a, "base64").length, 16);
});
