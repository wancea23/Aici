import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ABSOLUTE_SEC, IDLE_SEC, REFRESH_SEC } from "../../src/features/citizens/session-policy";

test("a citizen session ends after an hour idle or 30 days in total", () => {
  assert.equal(IDLE_SEC, 60 * 60);
  assert.equal(ABSOLUTE_SEC, 30 * 24 * 60 * 60);
});

test("the privacy policy states the same limits", () => {
  const policy = readFileSync(join(process.cwd(), "docs", "PRIVACY.md"), "utf8");
  assert.match(policy, /o oră de inactivitate/);
  assert.match(policy, /cel mult 30 de zile/);
});

test("an active citizen is refreshed long before the idle limit", () => {
  assert.ok(REFRESH_SEC * 6 <= IDLE_SEC);
  assert.ok(IDLE_SEC < ABSOLUTE_SEC);
});
