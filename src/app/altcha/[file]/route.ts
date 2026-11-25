import { readFile } from "node:fs/promises";
import path from "node:path";

// ALTCHA's proof of work runs in a worker. The external build (see ui/AltchaWidget.tsx) doesn't
// inline it as a blob URL, so the Content-Security-Policy can keep workers to our own origin, and
// the worker file is served from here, like the MapLibre one in src/app/maplibre.
const files = new Set(["pbkdf2.js"]);
const dir = path.join(process.cwd(), "node_modules", "altcha", "dist", "workers");

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Only these names, the request never picks a path.
  if (!files.has(file)) {
    return new Response("Not found", { status: 404 });
  }

  const body = await readFile(path.join(dir, file));
  return new Response(body, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
