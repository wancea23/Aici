import sharp from "sharp";
import { blurFaces } from "@/features/photos/face-blur";

const allowed = new Set(["jpeg", "png", "webp"]);

const jpegMagic = [0xff, 0xd8, 0xff];
const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// Each real image format starts with a fixed sequence of bytes. Checking those cheaply,
// before the file ever reaches sharp, rejects obviously fake or malformed uploads without
// handing untrusted bytes to a heavier, more complex decoder.
export function looksLikeImage(buf: Buffer): boolean {
  if (buf.length >= jpegMagic.length && jpegMagic.every((byte, i) => buf[i] === byte)) return true;
  if (buf.length >= pngMagic.length && pngMagic.every((byte, i) => buf[i] === byte)) return true;
  // WEBP: "RIFF", 4 bytes of chunk size, then "WEBP".
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return true;
  }
  return false;
}

// Re encodes the photo into a fresh webp, blurring any faces found in it along the way.
// This also applies the orientation flag to the pixels and drops EXIF, GPS and anything
// else hidden in the original file.
export async function cleanPhoto(input: Buffer): Promise<Buffer> {
  const image = sharp(input, { failOn: "error" });
  const meta = await image.metadata();

  if (!meta.format || !allowed.has(meta.format)) {
    throw new Error("unsupported image");
  }

  const resized = await image
    .rotate()
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .toBuffer();

  // Blurring happens on the already-resized image: one known size to reason about, and
  // faces get bigger, easier-to-detect regions than shrinking them down first would give.
  const blurred = await blurFaces(resized);

  return sharp(blurred).webp({ quality: 75 }).toBuffer();
}
