import "server-only";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import * as ort from "onnxruntime-web/wasm";
import { buildTiles, mergeOverlapping, type Box } from "@/features/photos/tiles";

// A YOLOv9-tiny model trained specifically for license plates (MIT licensed, from
// github.com/ankandrew/open-image-models), bundled the same way the face model is: read from
// disk at request time instead of fetched over the network, so it keeps working offline and
// doesn't depend on that hosting staying up. See public/models/plates for the file this needs.
const MODEL_PATH = path.join(process.cwd(), "public", "models", "plates", "plate-detector.onnx");

// onnxruntime-web resolves its .wasm files relative to wherever it thinks it's running from,
// which is a bundler's guess, not a fact, once Next.js has packed this file into its own
// server bundle. Pointing it at the real on-disk location directly sidesteps that guess,
// the same reasoning that has the face model read via fs instead of an import. It has to be a
// file:// URL, not a raw path — onnxruntime-web loads it with a dynamic import(), and on
// Windows a bare "C:\..." path isn't a URL scheme that's valid there.
const WASM_DIR = pathToFileURL(path.join(process.cwd(), "node_modules", "onnxruntime-web", "dist") + path.sep).href;

const IMG_SIZE = 640;
const SCORE_THRESHOLD = 0.5;

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function loadModel(): Promise<ort.InferenceSession> {
  sessionPromise ??= (async () => {
    ort.env.wasm.wasmPaths = WASM_DIR;
    // Threaded WASM wants SharedArrayBuffer and cross-origin isolation headers, neither of
    // which mean anything in a serverless function — forced off so it can't silently try and
    // fail differently on different hosts. Tiles already give this a way to use more than one
    // core's worth of work; this just keeps each individual inference call predictable.
    ort.env.wasm.numThreads = 1;
    const modelBytes = fs.readFileSync(MODEL_PATH);
    return ort.InferenceSession.create(modelBytes, { executionProviders: ["wasm"] });
  })();
  return sessionPromise;
}

type Letterboxed = { data: Float32Array; ratio: number; dw: number; dh: number };

// Resizes onto a square IMG_SIZE canvas without distorting the image's aspect ratio, padding
// the leftover space with mid-gray — exactly how this model was trained, per the reference
// implementation (github.com/ankandrew/open-image-models, yolo_v9/preprocess.py). ratio/dw/dh
// let detectInRegion below map a detection back out of this padded square afterwards.
async function letterbox(input: Buffer, width: number, height: number): Promise<Letterboxed> {
  const ratio = Math.min(IMG_SIZE / height, IMG_SIZE / width);
  const newWidth = Math.round(width * ratio);
  const newHeight = Math.round(height * ratio);
  const dw = Math.round((IMG_SIZE - newWidth) / 2 - 0.1);
  const dh = Math.round((IMG_SIZE - newHeight) / 2 - 0.1);

  const { data } = await sharp(input)
    .resize(newWidth, newHeight, { fit: "fill" })
    .extend({
      top: dh,
      bottom: IMG_SIZE - newHeight - dh,
      left: dw,
      right: IMG_SIZE - newWidth - dw,
      background: { r: 114, g: 114, b: 114 },
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // HWC uint8 RGB -> CHW float32 in [0, 1], the layout and range the model was trained on.
  const plane = IMG_SIZE * IMG_SIZE;
  const chw = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    chw[i] = data[i * 3] / 255;
    chw[plane + i] = data[i * 3 + 1] / 255;
    chw[2 * plane + i] = data[i * 3 + 2] / 255;
  }
  return { data: chw, ratio, dw, dh };
}

async function detectInRegion(session: ort.InferenceSession, input: Buffer, region: Box): Promise<Box[]> {
  const crop = await sharp(input).extract(region).toBuffer();
  const { data, ratio, dw, dh } = await letterbox(crop, region.width, region.height);
  const tensor = new ort.Tensor("float32", data, [1, 3, IMG_SIZE, IMG_SIZE]);

  const output = await session.run({ [session.inputNames[0]]: tensor });
  const predictions = output[session.outputNames[0]];
  const cols = predictions.dims[1] as number;
  const rows = predictions.dims[0] as number;
  const values = predictions.data as Float32Array;

  const boxes: Box[] = [];
  for (let i = 0; i < rows; i++) {
    const base = i * cols;
    // Columns are [batch index, x1, y1, x2, y2, class id, score] — see postprocess.py in the
    // reference implementation. Coordinates are pixels in the letterboxed IMG_SIZE square.
    const score = values[base + 6];
    if (score < SCORE_THRESHOLD) continue;

    const x1 = (values[base + 1] - dw) / ratio;
    const y1 = (values[base + 2] - dh) / ratio;
    const x2 = (values[base + 3] - dw) / ratio;
    const y2 = (values[base + 4] - dh) / ratio;

    const left = Math.max(0, Math.round(x1)) + region.left;
    const top = Math.max(0, Math.round(y1)) + region.top;
    const right = Math.min(region.width, Math.round(x2)) + region.left;
    const bottom = Math.min(region.height, Math.round(y2)) + region.top;
    const width = right - left;
    const height = bottom - top;
    if (width > 0 && height > 0) boxes.push({ left, top, width, height });
  }
  return boxes;
}

// Pixel positions of any detected plates, already clamped to the image bounds. Kept separate
// from applyPlateBlur below so the actual blurring can be tested without needing the model.
export async function detectPlates(input: Buffer): Promise<Box[]> {
  const meta = await sharp(input).metadata();
  if (!meta.width || !meta.height) return [];

  const session = await loadModel();
  const tiles = buildTiles(meta.width, meta.height);
  const perTile: Box[][] = [];
  // Run tiles one at a time, not with Promise.all: this is single-threaded WASM on the same
  // thread either way, and running them one at a time keeps peak memory to one tile's tensor
  // instead of all ten at once.
  for (const tile of tiles) {
    perTile.push(await detectInRegion(session, input, tile));
  }
  return mergeOverlapping(perTile.flat());
}

const MIN_BLUR_SIGMA = 10;
// A little bigger than the detected box: the model's box tends to hug the plate's printed
// characters tightly, right up to its edge or frame, and a report photo is rarely dead-on
// square to the plate — a small margin keeps a blurred-but-still-legible sliver from surviving
// at an angled edge, the same class of gap that came up tuning the face oval, without needing
// nearly as much tuning here since a plate has no hair or ears to accidentally keep visible.
const PAD_FACTOR = 0.15;

// Blurs each given region of the image — a plain rectangle, unlike the face oval, since a
// plate already is one. Pure image editing, no detection — the regions can come from
// detectPlates, or from a test that doesn't want to run the model.
export async function applyPlateBlur(input: Buffer, boxes: Box[]): Promise<Buffer> {
  if (boxes.length === 0) return input;
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const overlays = await Promise.all(
    boxes.map(async (box) => {
      const padX = Math.round(box.width * PAD_FACTOR);
      const padY = Math.round(box.height * PAD_FACTOR);
      const left = Math.max(0, box.left - padX);
      const top = Math.max(0, box.top - padY);
      const right = Math.min(width, box.left + box.width + padX);
      const bottom = Math.min(height, box.top + box.height + padY);
      const padded: Box = { left, top, width: right - left, height: bottom - top };

      const sigma = Math.max(MIN_BLUR_SIGMA, Math.max(padded.width, padded.height) / 3);
      const blurred = await sharp(input).extract(padded).blur(sigma).toBuffer();
      return { input: blurred, left: padded.left, top: padded.top };
    })
  );

  return sharp(input).composite(overlays).removeAlpha().toBuffer();
}

// Finds plates and blurs each one. Returns the input unchanged if none are found — most
// reports (a pothole, a broken light) have no vehicle in them at all.
export async function blurPlates(input: Buffer): Promise<Buffer> {
  const boxes = await detectPlates(input);
  return applyPlateBlur(input, boxes);
}
