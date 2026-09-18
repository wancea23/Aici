import "server-only";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import "@tensorflow/tfjs-backend-cpu";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import * as blazeface from "@tensorflow-models/blazeface";
import { buildTiles, mergeOverlapping, type Box } from "@/features/photos/tiles";

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
    const weightBuffer = fs.readFileSync(path.join(MODEL_DIR, "group1-shard1of1.bin"));
    // A Buffer's own .buffer is typed ArrayBufferLike (it can be a SharedArrayBuffer), and
    // for a small file it can even be a view into a larger pool shared with unrelated reads
    // elsewhere. Copying into a Uint8Array allocated right here sidesteps both problems: it
    // holds exactly these bytes, and — unlike a Buffer's — is never shared-memory backed, so
    // the cast below just states a fact tfjs's WeightData type otherwise can't be told.
    const weightCopy = new Uint8Array(weightBuffer.byteLength);
    weightCopy.set(weightBuffer);
    const weightData = weightCopy.buffer as ArrayBuffer;
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

// BlazeFace resizes whatever it's given down to a fixed 128x128 before it looks at it, so a
// face that's already small in a normal, uncropped photo shrinks to just a handful of pixels
// there — confirmed directly: it found nothing at all on a real report-style photo even with
// detection turned as sensitive as it goes, yet found the very same face instantly once
// cropped in close. buildTiles (see tiles.ts) runs detection on the whole image plus a grid
// of overlapping, zoomed in crops instead, giving a small face somewhere it isn't small.

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

  // BlazeFace's raw box already lands on the face itself — padding it out covered hair and
  // ears that should stay visible, but shrinking it further left a sliver of jaw/cheek
  // uncovered on one side. Left at zero: the raw box, no bigger and no smaller.
  // Coordinates are within this crop; region.left/top shifts them back to the full image.
  const padFactor = 0;

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

// A soft-edged white ellipse filling most of width x height, on a transparent background.
// Composited over a blurred crop with the "dest-in" blend mode, it keeps only the oval part
// of that crop opaque — corners of the bounding box stay untouched, original pixels, instead
// of blurring the whole rectangle around a face that's actually oval, not square.
async function ellipseMask(width: number, height: number): Promise<Buffer> {
  const svg = `<svg width="${width}" height="${height}">
    <ellipse cx="${width / 2}" cy="${height / 2}" rx="${width * 0.46}" ry="${height * 0.46}" fill="white" />
  </svg>`;
  const hardEdge = await sharp(Buffer.from(svg)).png().toBuffer();
  // Blurring the mask itself softens its edge, rather than relying on SVG filter support,
  // which varies across the library sharp renders SVG with.
  const feather = Math.max(2, Math.min(width, height) * 0.08);
  return sharp(hardEdge).blur(feather).toBuffer();
}

// Blurs each given region of the image, in the oval shape of a face rather than the
// rectangle it was detected in. Pure image editing, no detection — the regions can come
// from detectFaces, or from a test that doesn't want to run the model.
export async function applyBlur(input: Buffer, boxes: Box[]): Promise<Buffer> {
  if (boxes.length === 0) return input;

  const overlays = await Promise.all(
    boxes.map(async (box) => {
      const sigma = Math.max(MIN_BLUR_SIGMA, Math.max(box.width, box.height) / 5);
      const [blurred, mask] = await Promise.all([
        sharp(input).extract(box).blur(sigma).toBuffer(),
        ellipseMask(box.width, box.height),
      ]);
      const oval = await sharp(blurred).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
      return { input: oval, left: box.left, top: box.top };
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
