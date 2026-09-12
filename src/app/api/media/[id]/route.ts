import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { isUuid } from "@/lib/validation";
import { requireStaffApi } from "@/lib/auth/dal";

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

  return new NextResponse(photo.data, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
