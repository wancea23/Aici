import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import sql from "@/lib/db";
import { reportInput } from "@/lib/validation";
import { cleanPhoto } from "@/lib/image";
import { listReports } from "@/lib/reports";
import { encryptBytes, encryptText } from "@/lib/crypto";
import { requireStaffApi } from "@/lib/auth/dal";
import { clientInfo } from "@/lib/auth/request";
import { countAttempt, peek, rules } from "@/lib/auth/rate-limit";
import { tooMany } from "@/lib/auth/http";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

// The database keeps the location rounded to about 100 m. The exact point is encrypted.
const coarse = (x: number) => Math.round(x * 1000) / 1000;

export async function POST(req: NextRequest) {
  // Checked from the header, before the body is read into memory.
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "poza e prea mare" }, { status: 413 });
  }

  const ipKey = clientInfo(req).ip ?? "unknown";
  const limit = await peek(rules.reportIp, ipKey);
  if (limit.blocked) return tooMany(limit.retryAfter);
  await countAttempt(rules.reportIp, ipKey);

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
      insert into reports (id, category, description, location, geom)
      values (
        ${id}, ${category},
        ${encryptText(description, `report:${id}:description`)},
        ${encryptText(`${lat},${lng}`, `report:${id}:location`)},
        ST_SetSRID(ST_MakePoint(${coarse(lng)}, ${coarse(lat)}), 4326)
      )
    `;
    await tx`
      insert into report_photos (report_id, data)
      values (${id}, ${encryptBytes(clean, `report:${id}:photo`)})
    `;
  });

  return NextResponse.json({ id }, { status: 201 });
}

// Submitting stays open to citizens, reading the list is for staff.
export async function GET() {
  const auth = await requireStaffApi();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await listReports(), { headers: { "Cache-Control": "no-store" } });
}
