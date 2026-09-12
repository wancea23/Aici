import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { isUuid } from "@/lib/validation";
import { requireStaffApi } from "@/lib/auth/dal";
import { decryptBytes } from "@/lib/crypto";

export const runtime = "nodejs";

// Photos are for staff only until faces and plates are blurred for a public feed.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!isUuid(id)) {
    return new NextResponse("not found", { status: 404 });
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
