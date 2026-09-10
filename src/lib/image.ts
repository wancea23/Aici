import sharp from "sharp";

const allowed = new Set(["jpeg", "png", "webp"]);

// Re encodes the photo into a fresh webp. This applies the orientation flag to the
// pixels and drops EXIF, GPS and anything else hidden in the original file.
export async function cleanPhoto(input: Buffer): Promise<Buffer> {
  const image = sharp(input, { failOn: "error" });
  const meta = await image.metadata();

  if (!meta.format || !allowed.has(meta.format)) {
    throw new Error("unsupported image");
  }

  return image
    .rotate()
    .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}
