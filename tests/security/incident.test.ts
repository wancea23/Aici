import { test } from "node:test";
import assert from "node:assert/strict";
import { describeError, unexpectedError } from "../../src/server/http/incident";

function capture(run: () => Response) {
  const real = console.error;
  const lines: string[] = [];
  console.error = (...args: unknown[]) => void lines.push(args.join(" "));
  try {
    return { res: run(), lines };
  } finally {
    console.error = real;
  }
}

test("an unexpected error becomes a 500 with a code and no details", async () => {
  const err = new Error("connect ECONNREFUSED 10.0.0.5:5432");
  const { res, lines } = capture(() => unexpectedError(err, new Request("https://aici.example/api/reports")));
  assert.equal(res.status, 500);
  assert.equal(res.headers.get("Cache-Control"), "no-store");
  const body = await res.json();
  assert.match(body.code, /^[0-9a-f]{8}$/);
  assert.ok(body.error.includes(body.code));
  assert.ok(!JSON.stringify(body).includes("ECONNREFUSED"));
  assert.equal(lines.length, 1);
  assert.ok(lines[0].includes(`[${body.code}] GET /api/reports failed`));
  assert.ok(lines[0].includes("ECONNREFUSED"));
});

test("every incident gets its own code", async () => {
  const quiet = () => capture(() => unexpectedError(new Error("x"), null)).res.json();
  const [a, b] = await Promise.all([quiet(), quiet()]);
  assert.notEqual(a.code, b.code);
});

test("query parameters attached to a database error stay out of the log", () => {
  const err = Object.assign(new Error("duplicate key value"), {
    code: "23505",
    parameters: ["someone@example.com"],
  });
  const text = describeError(err);
  assert.ok(text.includes("(23505)"));
  assert.ok(!text.includes("someone@example.com"));
});

test("things thrown that are not errors are still described", () => {
  assert.equal(describeError("boom"), "boom");
});
