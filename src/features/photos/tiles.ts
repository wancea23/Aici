export type Box = { left: number; top: number; width: number; height: number };

// Small detection models resize whatever they're given down to a fixed, small square before
// they look at it, so a target that's already small in a normal, uncropped photo shrinks to
// just a handful of pixels there — confirmed directly for faces: detection found nothing at
// all on a real report-style photo, yet found the very same face instantly once cropped in
// close. So detection runs on the whole image plus a grid of overlapping, zoomed in crops,
// giving a small target somewhere it isn't small. Every tile costs real time — kept to ten
// passes total, not the fifty-plus a finer grid would need.
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

// The same target is often caught by more than one overlapping tile — merged here so it gets
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
