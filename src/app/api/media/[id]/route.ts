import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { isUuid } from "@/lib/validation";
import { requireStaffApi } from "@/lib/auth/dal";
import { decryptBytes } from "@/lib/crypto";
import { publicDetails } from "@/lib/env";

export const runtime = "nodejs";

// Staff see every photo. Faces and plates aren't blurred yet, so everyone else sees them only
// while PUBLIC_DETAILS is on, and only for reports that are on the public map.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffApi();
  if (!auth.ok && !publicDetails()) return auth.response;

  const { id } = await params;
  if (!isUuid(id)) {
    return new NextResponse("not found", { status: 404 });
  }

  if (!auth.ok) {
    const [onMap] = await sql`select 1 from reports where id = ${id} and status <> 'respins'`;
    if (!onMap) return new NextResponse("not found", { status: 404 });
  }

  const [photo] = await sql`select data from report_photos where report_id = ${id}`;
  if (!photo) {
    return new NextResponse("not found", { status: 404 });
  }

  let data: Buffer;
  try {
    data = decryptBytes(photo.data, `report:${id}:photo`);
  } catch (err) {
    console.error("could not decrypt photo", id, err);
    return new NextResponse("photo unavailable", { status: 500 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
