import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import sql from "@/lib/db";
import { reportInput } from "@/lib/validation";
import { cleanPhoto } from "@/lib/image";
import { listReports } from "@/lib/reports";
import { requireStaffApi } from "@/lib/auth/dal";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

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
  const { category, description, lat, lng } = parsed.data;

  // One transaction, so a report is never saved without its photo.
  await sql.begin(async (tx) => {
    await tx`
      insert into reports (id, category, description, geom)
      values (${id}, ${category}, ${description}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
    `;
    await tx`insert into report_photos (report_id, data) values (${id}, ${clean})`;
  });

  return NextResponse.json({ id }, { status: 201 });
}

// Submitting stays open to citizens, reading the list is for staff.
export async function GET() {
  const auth = await requireStaffApi();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await listReports(), { headers: { "Cache-Control": "no-store" } });
}
