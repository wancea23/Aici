import { test } from "node:test";
import assert from "node:assert/strict";
import { outsideArea, reportInput } from "../../src/features/reports/validation";

const report = (lat: number, lng: number) =>
  reportInput.safeParse({ category: "groapa", description: "", lat: String(lat), lng: String(lng) });

test("reports inside Moldova are accepted", () => {
  assert.equal(report(47.0105, 28.8638).success, true); // Chisinau
  assert.equal(report(47.7631, 27.9295).success, true); // Balti
  assert.equal(report(45.4675, 28.1994).success, true); // Giurgiulesti, the southern tip
  assert.equal(report(48.4718, 27.5977).success, true); // Naslavcea, the northern tip
});

test("reports outside the service area are refused with a clear message", () => {
  for (const [lat, lng] of [
    [44.4268, 26.1025], // Bucharest
    [50.4501, 30.5234], // Kyiv
    [46.4825, 30.7233], // Odesa
    [0, 0],
  ]) {
    const parsed = report(lat, lng);
    assert.equal(parsed.success, false, `${lat}, ${lng}`);
    assert.ok(parsed.error?.issues.some((issue) => issue.message === outsideArea));
  }
});

test("a location that isn't a number is still just invalid", () => {
  const parsed = reportInput.safeParse({ category: "groapa", lat: "abc", lng: "28.8" });
  assert.equal(parsed.success, false);
  assert.ok(!parsed.error?.issues.some((issue) => issue.message === outsideArea));
});
