import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

const uploadDir = process.env.UPLOAD_DIR || "./data/uploads";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!uuid.test(params.id)) {
    return new NextResponse("not found", { status: 404 });
  }
  try {
    const data = await readFile(join(uploadDir, `${params.id}.webp`));
    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
