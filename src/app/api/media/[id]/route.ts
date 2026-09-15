import { NextResponse } from "next/server";
import { withAccess } from "@/lib/db-access";
import { isUuid } from "@/lib/validation";
import { requireStaffApi } from "@/lib/auth/dal";
import { currentCitizen } from "@/lib/auth/citizen-session";
import { decryptBytes } from "@/lib/crypto";
import { publicDetails } from "@/lib/env";

export const runtime = "nodejs";

// Staff see every photo, and a citizen sees photos of reports they submitted. Faces and
// plates aren't blurred yet, so anyone else sees one only while PUBLIC_DETAILS is on, and
// only for a report that's on the public map. Row-level security (see db/init.sql) is what
// actually enforces this now: the select below simply returns nothing for anyone it doesn't
// apply to, instead of the route working that out by hand.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) {
    return new NextResponse("not found", { status: 404 });
  }

  const auth = await requireStaffApi();
  const citizen = auth.ok ? null : await currentCitizen();

  const [photo] = await withAccess(
    { staff: auth.ok, citizenId: citizen?.id, publicDetails: publicDetails() },
    (tx) => tx`select data from report_photos where report_id = ${id}`
  );
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
