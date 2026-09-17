import { test } from "node:test";
import assert from "node:assert/strict";
import { howMany } from "../../src/ui/format";

test("Romanian counts take de from 20 on", () => {
  assert.equal(howMany(2, "sesizări"), "2 sesizări");
  assert.equal(howMany(19, "sesizări"), "19 sesizări");
  assert.equal(howMany(20, "sesizări"), "20 de sesizări");
  assert.equal(howMany(101, "ori"), "101 ori");
  assert.equal(howMany(119, "ori"), "119 ori");
  assert.equal(howMany(120, "ori"), "120 de ori");
  assert.equal(howMany(200, "ori"), "200 de ori");
});
