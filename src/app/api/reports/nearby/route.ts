import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { nearbyInput } from "@/lib/validation";
import { readDescription } from "@/lib/reports";
import { publicDetails } from "@/lib/env";

const RADIUS_METERS = 10;

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

  const rows = await sql`
    select id, description, status, created_at
    from reports
    where category = ${category}
      and status in ('nou', 'in_lucru')
      and ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${RADIUS_METERS}
      )
    order by created_at desc
    limit 5
  `;

  // Descriptions are stored encrypted and go out readable only while PUBLIC_DETAILS is on.
  const details = publicDetails();
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      status: r.status,
      created_at: r.created_at,
      description: details ? readDescription(r.id, r.description) : "",
    }))
  );
}
