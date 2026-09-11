import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!uuid.test(params.id)) {
    return new NextResponse("not found", { status: 404 });
  }

  const [photo] = await sql`select data from report_photos where report_id = ${params.id}`;
  if (!photo) {
    return new NextResponse("not found", { status: 404 });
  }

  return new NextResponse(photo.data, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
