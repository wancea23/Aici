import { readFile } from "node:fs/promises";
import path from "node:path";

// MapLibre starts its worker from a URL and the worker imports the shared file
// next to it. The bundler can't rewrite that, so both files are served from here.
const files = new Set(["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]);
const dir = path.join(process.cwd(), "node_modules", "maplibre-gl", "dist");

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  // Only these two names, the request never picks a path.
  if (!files.has(params.file)) {
    return new Response("Not found", { status: 404 });
  }

  const body = await readFile(path.join(dir, params.file));
  return new Response(body, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
