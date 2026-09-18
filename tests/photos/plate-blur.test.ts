import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { applyPlateBlur } from "../../src/features/photos/plate-blur";
import type { Box } from "../../src/features/photos/tiles";

const WIDTH = 60;
const HEIGHT = 40;

// Fine checkerboard everywhere — high-frequency detail, easy to tell blurred from sharp, and
// uniform enough that any pixel is a fair stand-in for "the plate" or "the rest of the photo".
async function checkerboardImage(): Promise<Buffer> {
  const channels = 3;
  const data = Buffer.alloc(WIDTH * HEIGHT * channels);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const i = (y * WIDTH + x) * channels;
      const on = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0;
      data[i] = data[i + 1] = data[i + 2] = on ? 255 : 0;
    }
  }
  return sharp(data, { raw: { width: WIDTH, height: HEIGHT, channels } }).png().toBuffer();
}

function variance(data: Buffer): number {
  const mean = data.reduce((s, v) => s + v, 0) / data.length;
  return data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length;
}

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

test("no boxes leaves the image untouched", async () => {
  const input = await checkerboardImage();
  const output = await applyPlateBlur(input, []);
  assert.equal(output, input);
});

test("blurs a padded rectangle around the box, leaves the far corners pixel-identical", async () => {
  const input = await checkerboardImage();
  // Placed away from every edge so the box's own padding never gets clamped by the image
  // bounds — this test is about the padding margin itself, not the clamping in the next one.
  const box: Box = { left: 20, top: 10, width: 15, height: 10 };
  const output = await applyPlateBlur(input, [box]);

  const inRaw = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const outRaw = await sharp(output).raw().toBuffer({ resolveWithObject: true });
  const { channels } = inRaw.info;

  const before = extractRegion(inRaw.data, WIDTH, box.left, box.top, box.width, box.height, channels);
  const after = extractRegion(outRaw.data, WIDTH, box.left, box.top, box.width, box.height, channels);
  assert.ok(
    variance(after) < variance(before) * 0.3,
    `expected the plate region's variance to drop sharply, was ${variance(before)} -> ${variance(after)}`
  );

  // Well clear of the box and its padding on every side.
  const farCorners: [number, number][] = [
    [0, 0],
    [WIDTH - 1, 0],
    [0, HEIGHT - 1],
    [WIDTH - 1, HEIGHT - 1],
  ];
  for (const [x, y] of farCorners) {
    const b = extractRegion(inRaw.data, WIDTH, x, y, 1, 1, channels);
    const a = extractRegion(outRaw.data, WIDTH, x, y, 1, 1, channels);
    assert.deepEqual(a, b, `corner (${x},${y}) should be untouched, well outside the padded box`);
  }
});

test("a box flush against the image edge still blurs instead of rejecting", async () => {
  const input = await checkerboardImage();
  // Padding would push this box's left/top past 0 — applyPlateBlur has to clamp that itself,
  // unlike applyBlur's oval, which can afford to let out-of-bounds boxes reject (detectFaces
  // always pads a face inward first). Plates get padded outward instead, on purpose, so this
  // clamp is load-bearing, not defensive filler.
  const box: Box = { left: 0, top: 0, width: 10, height: 8 };
  const output = await applyPlateBlur(input, [box]);

  const inRaw = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const outRaw = await sharp(output).raw().toBuffer({ resolveWithObject: true });
  const { channels } = inRaw.info;

  const before = extractRegion(inRaw.data, WIDTH, 0, 0, box.width, box.height, channels);
  const after = extractRegion(outRaw.data, WIDTH, 0, 0, box.width, box.height, channels);
  assert.ok(variance(after) < variance(before) * 0.3, "the box itself should still end up blurred");

  const farCorner = extractRegion(outRaw.data, WIDTH, WIDTH - 1, HEIGHT - 1, 1, 1, channels);
  const farCornerBefore = extractRegion(inRaw.data, WIDTH, WIDTH - 1, HEIGHT - 1, 1, 1, channels);
  assert.deepEqual(farCorner, farCornerBefore, "the opposite corner should stay untouched");
});

test("two separate plates both get blurred", async () => {
  const input = await checkerboardImage();
  const boxA: Box = { left: 2, top: 2, width: 8, height: 6 };
  const boxB: Box = { left: 40, top: 25, width: 10, height: 8 };
  const output = await applyPlateBlur(input, [boxA, boxB]);

  const inRaw = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const outRaw = await sharp(output).raw().toBuffer({ resolveWithObject: true });
  const { channels } = inRaw.info;

  for (const box of [boxA, boxB]) {
    const before = extractRegion(inRaw.data, WIDTH, box.left, box.top, box.width, box.height, channels);
    const after = extractRegion(outRaw.data, WIDTH, box.left, box.top, box.width, box.height, channels);
    assert.ok(variance(after) < variance(before) * 0.3, `box at (${box.left},${box.top}) should be blurred`);
  }
});
