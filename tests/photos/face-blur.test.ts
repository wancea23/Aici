import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { applyBlur, buildTiles, mergeOverlapping, type Box } from "../../src/features/photos/face-blur";

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

test("blurs the given region, leaves everything outside it pixel-identical", async () => {
  const input = await checkerboardImage();
  const box: Box = { left: 0, top: 0, width: WIDTH / 2, height: HEIGHT };
  const output = await applyBlur(input, [box]);

  const inRaw = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const outRaw = await sharp(output).raw().toBuffer({ resolveWithObject: true });
  const { channels } = inRaw.info;

  // The checkerboard half should be noticeably smoothed out overall, not just re-encoded
  // losslessly — the finer claim, that only the oval part of it actually blurred, is its
  // own test below, since the corners of this same box are expected to stay untouched.
  const leftBefore = extractRegion(inRaw.data, WIDTH, box.left, box.top, box.width, box.height, channels);
  const leftAfter = extractRegion(outRaw.data, WIDTH, box.left, box.top, box.width, box.height, channels);
  assert.ok(
    variance(leftAfter) < variance(leftBefore) * 0.7,
    `expected the blurred region's variance to drop noticeably, was ${variance(leftBefore)} -> ${variance(leftAfter)}`
  );

  // The untouched half must be byte-for-byte identical, not just similar.
  const rightBox = { left: WIDTH / 2, top: 0, width: WIDTH / 2, height: HEIGHT };
  const rightBefore = extractRegion(inRaw.data, WIDTH, rightBox.left, rightBox.top, rightBox.width, rightBox.height, channels);
  const rightAfter = extractRegion(outRaw.data, WIDTH, rightBox.left, rightBox.top, rightBox.width, rightBox.height, channels);
  assert.deepEqual(rightAfter, rightBefore);
});

test("blurs the oval part of a box, leaves its corners untouched", async () => {
  // A box that's entirely fine checkerboard, this time — so its corners (outside any
  // ellipse inscribed in it) and its center (inside one) can both be checked directly.
  const size = 40;
  const channels = 3;
  const data = Buffer.alloc(size * size * channels);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * channels;
      const on = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0;
      data[i] = data[i + 1] = data[i + 2] = on ? 255 : 0;
    }
  }
  const input = await sharp(data, { raw: { width: size, height: size, channels } }).png().toBuffer();
  const box: Box = { left: 0, top: 0, width: size, height: size };
  const output = await applyBlur(input, [box]);

  const inRaw = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const outRaw = await sharp(output).raw().toBuffer({ resolveWithObject: true });

  // A few pixels in from each corner, comfortably outside any ellipse inscribed in the box.
  const corners: [number, number][] = [
    [1, 1],
    [size - 2, 1],
    [1, size - 2],
    [size - 2, size - 2],
  ];
  for (const [x, y] of corners) {
    const before = extractRegion(inRaw.data, size, x, y, 1, 1, channels);
    const after = extractRegion(outRaw.data, size, x, y, 1, 1, channels);
    assert.deepEqual(after, before, `corner (${x},${y}) should be untouched, outside the oval`);
  }

  // The center, well inside the oval, should be smoothed toward mid-gray, not still checkered.
  const centerBefore = extractRegion(inRaw.data, size, size / 2 - 3, size / 2 - 3, 6, 6, channels);
  const centerAfter = extractRegion(outRaw.data, size, size / 2 - 3, size / 2 - 3, 6, 6, channels);
  assert.ok(
    variance(centerAfter) < variance(centerBefore) * 0.3,
    `expected the center to be heavily blurred, was ${variance(centerBefore)} -> ${variance(centerAfter)}`
  );
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
