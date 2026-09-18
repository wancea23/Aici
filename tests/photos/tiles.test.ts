import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTiles, mergeOverlapping, type Box } from "../../src/features/photos/tiles";

test("buildTiles always covers the whole image and stays in bounds", () => {
  const width = 591;
  const height = 1280;
  const tiles = buildTiles(width, height);

  assert.deepEqual(tiles[0], { left: 0, top: 0, width, height }, "first tile is the full image");
  for (const t of tiles) {
    assert.ok(t.left >= 0 && t.top >= 0, "no negative origin");
    assert.ok(t.left + t.width <= width, "no overflow past the right edge");
    assert.ok(t.top + t.height <= height, "no overflow past the bottom edge");
  }
  // Kept small on purpose (see the comment above buildTiles) — this is really a guard
  // against someone widening the grid later without noticing the cost that adds.
  assert.ok(tiles.length <= 12, `expected a small, fixed tile count, got ${tiles.length}`);
});

test("buildTiles handles a tiny image without producing an invalid tile", () => {
  const tiles = buildTiles(20, 15);
  for (const t of tiles) {
    assert.ok(t.width > 0 && t.height > 0);
    assert.ok(t.left + t.width <= 20 && t.top + t.height <= 15);
  }
});

test("mergeOverlapping leaves separate targets separate", () => {
  const a: Box = { left: 0, top: 0, width: 10, height: 10 };
  const b: Box = { left: 100, top: 100, width: 10, height: 10 };
  const merged = mergeOverlapping([a, b]);
  assert.equal(merged.length, 2);
});

test("mergeOverlapping combines two boxes the same target was found in twice", () => {
  const a: Box = { left: 0, top: 0, width: 20, height: 20 };
  const b: Box = { left: 10, top: 10, width: 20, height: 20 };
  const merged = mergeOverlapping([a, b]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0], { left: 0, top: 0, width: 30, height: 30 });
});

test("mergeOverlapping chains through an intermediate box into one region", () => {
  // a overlaps b, b overlaps c, but a and c don't touch directly — all three still belong
  // to the same target and should end up as a single merged box.
  const a: Box = { left: 0, top: 0, width: 15, height: 15 };
  const b: Box = { left: 10, top: 10, width: 15, height: 15 };
  const c: Box = { left: 20, top: 20, width: 15, height: 15 };
  const merged = mergeOverlapping([a, b, c]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0], { left: 0, top: 0, width: 35, height: 35 });
});
