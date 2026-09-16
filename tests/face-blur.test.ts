import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { applyBlur, buildTiles, mergeOverlapping, type Box } from "../src/lib/face-blur";

const WIDTH = 40;
const HEIGHT = 40;

// Left half: a fine checkerboard (high-frequency detail, easy to tell blurred from sharp).
// Right half: flat gray, used to prove untouched pixels really are untouched.
async function checkerboardImage(): Promise<Buffer> {
  const channels = 3;
  const data = Buffer.alloc(WIDTH * HEIGHT * channels);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const i = (y * WIDTH + x) * channels;
      if (x < WIDTH / 2) {
        const on = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0;
        data[i] = data[i + 1] = data[i + 2] = on ? 255 : 0;
      } else {
        data[i] = data[i + 1] = data[i + 2] = 128;
      }
    }
  }
  return sharp(data, { raw: { width: WIDTH, height: HEIGHT, channels } }).png().toBuffer();
}

function variance(data: Buffer): number {
  const mean = data.reduce((s, v) => s + v, 0) / data.length;
  return data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length;
}

test("no boxes leaves the image untouched", async () => {
  const input = await checkerboardImage();
  const output = await applyBlur(input, []);
  assert.equal(output, input);
});

test("blurs only the given region, leaves the rest pixel-identical", async () => {
  const input = await checkerboardImage();
  const box: Box = { left: 0, top: 0, width: WIDTH / 2, height: HEIGHT };
  const output = await applyBlur(input, [box]);

  const inRaw = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const outRaw = await sharp(output).raw().toBuffer({ resolveWithObject: true });
  const { channels } = inRaw.info;

  // The checkerboard half should be noticeably smoothed out, not just re-encoded losslessly.
  const leftBefore = extractRegion(inRaw.data, WIDTH, box.left, box.top, box.width, box.height, channels);
  const leftAfter = extractRegion(outRaw.data, WIDTH, box.left, box.top, box.width, box.height, channels);
  assert.ok(
    variance(leftAfter) < variance(leftBefore) * 0.5,
    `expected the blurred region's variance to drop by at least half, was ${variance(leftBefore)} -> ${variance(leftAfter)}`
  );

  // The untouched half must be byte-for-byte identical, not just similar.
  const rightBox = { left: WIDTH / 2, top: 0, width: WIDTH / 2, height: HEIGHT };
  const rightBefore = extractRegion(inRaw.data, WIDTH, rightBox.left, rightBox.top, rightBox.width, rightBox.height, channels);
  const rightAfter = extractRegion(outRaw.data, WIDTH, rightBox.left, rightBox.top, rightBox.width, rightBox.height, channels);
  assert.deepEqual(rightAfter, rightBefore);
});

test("an out-of-bounds box rejects instead of silently doing the wrong thing", async () => {
  const input = await checkerboardImage();
  // detectFaces always clamps a box to the image bounds before this is ever called for
  // real; this proves applyBlur doesn't quietly misbehave if some future caller doesn't.
  const box: Box = { left: WIDTH - 2, top: HEIGHT - 2, width: 10, height: 10 };
  await assert.rejects(() => applyBlur(input, [box]));
});

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

test("mergeOverlapping leaves separate faces separate", () => {
  const a: Box = { left: 0, top: 0, width: 10, height: 10 };
  const b: Box = { left: 100, top: 100, width: 10, height: 10 };
  const merged = mergeOverlapping([a, b]);
  assert.equal(merged.length, 2);
});

test("mergeOverlapping combines two boxes the same face was found in twice", () => {
  const a: Box = { left: 0, top: 0, width: 20, height: 20 };
  const b: Box = { left: 10, top: 10, width: 20, height: 20 };
  const merged = mergeOverlapping([a, b]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0], { left: 0, top: 0, width: 30, height: 30 });
});

test("mergeOverlapping chains through an intermediate box into one region", () => {
  // a overlaps b, b overlaps c, but a and c don't touch directly — all three still belong
  // to the same face and should end up as a single merged box.
  const a: Box = { left: 0, top: 0, width: 15, height: 15 };
  const b: Box = { left: 10, top: 10, width: 15, height: 15 };
  const c: Box = { left: 20, top: 20, width: 15, height: 15 };
  const merged = mergeOverlapping([a, b, c]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0], { left: 0, top: 0, width: 35, height: 35 });
});

function extractRegion(
  data: Buffer,
  stride: number,
  left: number,
  top: number,
  width: number,
  height: number,
  channels: number
): Buffer {
  const out = Buffer.alloc(width * height * channels);
  for (let y = 0; y < height; y++) {
    const srcStart = ((top + y) * stride + left) * channels;
    const srcEnd = srcStart + width * channels;
    data.copy(out, y * width * channels, srcStart, srcEnd);
  }
  return out;
}
