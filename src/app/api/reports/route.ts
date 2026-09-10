import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import sql from "@/lib/db";
import { reportInput } from "@/lib/validation";
import { cleanPhoto } from "@/lib/image";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const uploadDir = process.env.UPLOAD_DIR || "./data/uploads";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const photo = form.get("photo");

  const parsed = reportInput.safeParse({
    category: form.get("category"),
    description: form.get("description") ?? "",
    lat: form.get("lat"),
    lng: form.get("lng"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "date invalide" }, { status: 400 });
  }
  if (!(photo instanceof File)) {
    return NextResponse.json({ error: "lipsește poza" }, { status: 400 });
  }
  if (photo.size > MAX_BYTES) {
    return NextResponse.json({ error: "poza e prea mare" }, { status: 413 });
  }

  const raw = Buffer.from(await photo.arrayBuffer());

  let clean: Buffer;
  try {
    clean = await cleanPhoto(raw);
  } catch {
    return NextResponse.json({ error: "fișierul nu e o imagine validă" }, { status: 400 });
  }

  const id = randomUUID();
  await mkdir(uploadDir, { recursive: true });
  const file = join(uploadDir, `${id}.webp`);
  await writeFile(file, clean);

  const { category, description, lat, lng } = parsed.data;
  try {
    await sql`
      insert into reports (id, category, description, geom)
      values (${id}, ${category}, ${description}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
    `;
  } catch (err) {
    await unlink(file).catch(() => {});
    throw err;
  }

  return NextResponse.json({ id }, { status: 201 });
}

export async function GET() {
  const rows = await sql`
    select id, category, description, status,
           ST_Y(geom) as lat, ST_X(geom) as lng, created_at
    from reports
    order by created_at desc
    limit 100
  `;
  return NextResponse.json(rows);
}
