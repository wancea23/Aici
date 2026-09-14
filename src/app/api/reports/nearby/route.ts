import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { nearbyInput } from "@/lib/validation";
import { readDescription } from "@/lib/reports";
import { decryptText } from "@/lib/crypto";
import { publicDetails } from "@/lib/env";

const RADIUS_METERS = 10;

// geom is only accurate to about 100m (see db/init.sql), so this pulls in every row that
// could possibly be within RADIUS_METERS once the exact, decrypted location is checked below.
const CANDIDATE_RADIUS_METERS = 250;

const EARTH_RADIUS_METERS = 6371000;

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = nearbyInput.safeParse({
    category: searchParams.get("category"),
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "date invalide" }, { status: 400 });
  }
  const { category, lat, lng } = parsed.data;

  const candidates = await sql`
    select id, description, status, created_at, location
    from reports
    where category = ${category}
      and status in ('nou', 'in_lucru')
      and ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${CANDIDATE_RADIUS_METERS}
      )
    order by created_at desc
    limit 20
  `;

  // The real check: decrypt each candidate's exact location, kept only here on the
  // server, and measure the real distance instead of trusting the coarse geom point.
  const matches = candidates.filter((r) => {
    if (!r.location) return false;
    try {
      const [rLat, rLng] = decryptText(r.location, `report:${r.id}:location`)
        .split(",")
        .map(Number);
      return distanceMeters(lat, lng, rLat, rLng) <= RADIUS_METERS;
    } catch {
      return false;
    }
  });

  const details = publicDetails();
  return NextResponse.json(
    matches.slice(0, 5).map((r) => ({
      id: r.id,
      status: r.status,
      created_at: r.created_at,
      description: details ? readDescription(r.id, r.description) : "",
    }))
  );
}
