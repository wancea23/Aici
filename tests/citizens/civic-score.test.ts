import { test } from "node:test";
import assert from "node:assert/strict";
import { civicScore, reportPoints } from "../../src/features/citizens/civic-score";

const event = (status: string) => ({ id: "e", status, previous: "nou", note: "", at: "2026-09-10T10:00:00Z" });

const report = (status: string, opts: { category?: string; at?: string; events?: ReturnType<typeof event>[] } = {}) => ({
  status,
  category: opts.category ?? "groapa",
  created_at: opts.at ?? "2026-09-01T10:00:00Z",
  events: opts.events ?? [],
});

test("a report earns more the further the city hall takes it", () => {
  assert.equal(reportPoints(report("nou")), 10);
  assert.equal(reportPoints(report("in_lucru")), 15);
  assert.equal(reportPoints(report("rezolvat")), 30);
  // resolved straight from new still counts the work step
  assert.equal(reportPoints(report("rezolvat", { events: [event("rezolvat")] })), 30);
});

test("a rejected report earns nothing, even if work had started", () => {
  assert.equal(reportPoints(report("respins", { events: [event("in_lucru"), event("respins")] })), 0);
});

test("levels follow the thresholds and show the way to the next one", () => {
  const empty = civicScore([]);
  assert.equal(empty.level.level, 1);
  assert.equal(empty.toNext, 30);
  assert.equal(empty.progress, 0);

  const s = civicScore([report("rezolvat"), report("rezolvat"), report("nou")]);
  assert.equal(s.points, 70);
  assert.equal(s.level.level, 2);
  assert.equal(s.toNext, 10);
  assert.equal(s.progress, 0.8);
});

test("the last level has no next one and a full bar", () => {
  const s = civicScore(Array.from({ length: 10 }, () => report("rezolvat")));
  assert.equal(s.level.level, 5);
  assert.equal(s.next, null);
  assert.equal(s.progress, 1);
});

test("badges come only from reports the city hall accepted", () => {
  const earned = (reports: ReturnType<typeof report>[]) =>
    civicScore(reports).badges.filter((b) => b.earned).map((b) => b.id);

  assert.deepEqual(earned([report("respins"), report("respins", { category: "gunoi" })]), []);
  assert.deepEqual(
    earned([
      report("rezolvat", { category: "groapa", at: "2026-07-05T10:00:00Z" }),
      report("nou", { category: "gunoi", at: "2026-08-05T10:00:00Z" }),
      report("nou", { category: "iluminat", at: "2026-09-05T10:00:00Z" }),
    ]),
    ["first", "firstFix", "explorer", "steady"]
  );
});
