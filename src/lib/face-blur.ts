import "server-only";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import "@tensorflow/tfjs-backend-cpu";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import * as blazeface from "@tensorflow-models/blazeface";

// The model is bundled with the app instead of fetched from Google's hosting at request
// time: a few milliseconds instead of ~2 seconds, and it keeps working even if that hosting
// ever goes away. See public/models/blazeface for the two files this needs.
const MODEL_DIR = path.join(process.cwd(), "public", "models", "blazeface");

let modelPromise: Promise<blazeface.BlazeFaceModel> | null = null;

function loadModel(): Promise<blazeface.BlazeFaceModel> {
  modelPromise ??= (async () => {
    await tf.setBackend("cpu");
    await tf.ready();

    const modelJson = JSON.parse(fs.readFileSync(path.join(MODEL_DIR, "model.json"), "utf8"));
    const weightData = fs.readFileSync(path.join(MODEL_DIR, "group1-shard1of1.bin")).buffer;
    const artifacts: tf.io.ModelArtifacts = {
      modelTopology: modelJson.modelTopology,
      weightSpecs: modelJson.weightsManifest[0].weights,
      weightData,
      format: modelJson.format,
      generatedBy: modelJson.generatedBy,
      convertedBy: modelJson.convertedBy,
    };
    return blazeface.load({ modelUrl: tf.io.fromMemory(artifacts) });
  })();
  return modelPromise;
}

export type Box = { left: number; top: number; width: number; height: number };

// BlazeFace resizes whatever it's given down to a fixed 128x128 before it looks at it, so a
// face that's already small in a normal, uncropped photo shrinks to just a handful of pixels
// there — confirmed directly: it found nothing at all on a real report-style photo even with
// detection turned as sensitive as it goes, yet found the very same face instantly once
// cropped in close. So detection runs on the whole image plus a grid of overlapping, zoomed
// in crops, giving a small face somewhere it isn't small. Every tile plus the padding below
// costs real time — kept to ten passes total, not the fifty-plus a finer grid would need.
export function buildTiles(width: number, height: number): Box[] {
  const tiles: Box[] = [{ left: 0, top: 0, width, height }];
  const fraction = 0.4;
  const starts = [0, 0.3, 0.6]; // each tile covers [start, start + fraction] of the image
  const tileWidth = Math.round(width * fraction);
  const tileHeight = Math.round(height * fraction);
  for (const sy of starts) {
    const top = Math.min(height - tileHeight, Math.round(height * sy));
    for (const sx of starts) {
      const left = Math.min(width - tileWidth, Math.round(width * sx));
      tiles.push({ left, top, width: tileWidth, height: tileHeight });
    }
  }
  return tiles;
}

async function detectInRegion(model: blazeface.BlazeFaceModel, input: Buffer, region: Box): Promise<Box[]> {
  const { data, info } = await sharp(input)
    .extract(region)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const tensor = tf.tensor3d(data, [info.height, info.width, info.channels]);
  let faces: blazeface.NormalizedFace[];
  try {
    faces = await model.estimateFaces(tensor, false);
  } finally {
    tensor.dispose();
  }

  // The detected box hugs the eyes/nose/mouth, not the whole head — padded out well past
  // that so hair, ears and jaw are covered too, since the point is nobody stays recognisable.
  // Coordinates are within this crop; region.left/top shifts them back to the full image.
  const padFactor = 0.6;

  return faces
    .map((face): Box | null => {
      const [x1, y1] = face.topLeft as [number, number];
      const [x2, y2] = face.bottomRight as [number, number];
      const padX = (x2 - x1) * padFactor;
      const padY = (y2 - y1) * padFactor;

      const left = Math.max(0, Math.round(x1 - padX)) + region.left;
      const top = Math.max(0, Math.round(y1 - padY)) + region.top;
      const right = Math.min(region.width, Math.round(x2 + padX)) + region.left;
      const bottom = Math.min(region.height, Math.round(y2 + padY)) + region.top;
      const width = right - left;
      const height = bottom - top;
      return width > 0 && height > 0 ? { left, top, width, height } : null;
    })
    .filter((b): b is Box => b !== null);
}

function overlaps(a: Box, b: Box): boolean {
  return a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height && a.top + a.height > b.top;
}

function union(a: Box, b: Box): Box {
  const left = Math.min(a.left, b.left);
  const top = Math.min(a.top, b.top);
  const right = Math.max(a.left + a.width, b.left + b.width);
  const bottom = Math.max(a.top + a.height, b.top + b.height);
  return { left, top, width: right - left, height: bottom - top };
}

// The same face is often caught by more than one overlapping tile — merged here so it gets
// blurred once, not several times over with slightly different, wastefully overlapping boxes.
export function mergeOverlapping(boxes: Box[]): Box[] {
  let merged = boxes;
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < merged.length; i++) {
      for (let j = i + 1; j < merged.length; j++) {
        if (overlaps(merged[i], merged[j])) {
          const combined = union(merged[i], merged[j]);
          merged = [combined, ...merged.filter((_, k) => k !== i && k !== j)];
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }
  return merged;
}

// Pixel positions of any detected faces, already clamped to the image bounds. Kept separate
// from applyBlur below so the actual blurring can be tested without needing the model at all.
export async function detectFaces(input: Buffer): Promise<Box[]> {
  const meta = await sharp(input).metadata();
  if (!meta.width || !meta.height) return [];

  const model = await loadModel();
  const tiles = buildTiles(meta.width, meta.height);
  const perTile = await Promise.all(tiles.map((tile) => detectInRegion(model, input, tile)));
  return mergeOverlapping(perTile.flat());
}

const MIN_BLUR_SIGMA = 8;

// Blurs each given region of the image in place. Pure image editing, no detection — the
// regions can come from detectFaces, or from a test that doesn't want to run the model.
export async function applyBlur(input: Buffer, boxes: Box[]): Promise<Buffer> {
  if (boxes.length === 0) return input;

  const overlays = await Promise.all(
    boxes.map(async (box) => {
      const sigma = Math.max(MIN_BLUR_SIGMA, Math.max(box.width, box.height) / 5);
      const blurred = await sharp(input).extract(box).blur(sigma).toBuffer();
      return { input: blurred, left: box.left, top: box.top };
    })
  );

  // composite() adds an alpha channel even when nothing involved had one — stripped back
  // off so the output has the same shape as the input, not a surprise side effect of blurring.
  return sharp(input).composite(overlays).removeAlpha().toBuffer();
}

// Finds faces and blurs each one. Returns the input unchanged if none are found — most
// reports (a pothole, a broken light) have no one in them at all.
export async function blurFaces(input: Buffer): Promise<Buffer> {
  const boxes = await detectFaces(input);
  return applyBlur(input, boxes);
}
