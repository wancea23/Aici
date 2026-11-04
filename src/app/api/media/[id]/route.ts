import { NextResponse } from "next/server";
import { withAccess } from "@/server/db/access";
import { isUuid } from "@/features/reports/validation";
import { requireStaffApi } from "@/features/staff/dal";
import { currentCitizen } from "@/features/citizens/session";
import { decryptBytes } from "@/server/security/crypto";
import { matchesFingerprint, reprDigest } from "@/features/photos/fingerprint";
import { publicDetails } from "@/server/env";
import { safeRoute } from "@/server/http/safe-route";

export const runtime = "nodejs";

// Staff see every photo, and a citizen sees photos of reports they submitted. Faces and
// plates aren't blurred yet, so anyone else sees one only while PUBLIC_DETAILS is on, and
// only for a report that's on the public map. Row-level security (see db/init.sql) is what
// actually enforces this now: the select below simply returns nothing for anyone it doesn't
// apply to, instead of the route working that out by hand.
async function handleGet(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) {
    return new NextResponse("not found", { status: 404 });
  }

  const auth = await requireStaffApi();
  const citizen = auth.ok ? null : await currentCitizen();

  const [photo] = await withAccess(
    { staff: auth.ok, citizenId: citizen?.id, publicDetails: publicDetails() },
    (tx) => tx`select data, sha256 from report_photos where report_id = ${id}`
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

  // A photo that no longer matches the fingerprint taken on arrival is never served.
  if (!matchesFingerprint(data, photo.sha256)) {
    console.error("photo fingerprint mismatch", id);
    return new NextResponse("photo unavailable", { status: 500 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      ...(photo.sha256 ? { "Repr-Digest": reprDigest(photo.sha256) } : {}),
    },
  });
}

export const GET = safeRoute(handleGet);
