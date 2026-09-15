import { NextRequest, NextResponse } from "next/server";
import { nearbyInput } from "@/lib/validation";
import { readDescription } from "@/lib/reports";
import { openGroupsNear } from "@/lib/duplicates";
import { withAccess } from "@/lib/db-access";
import { publicDetails } from "@/lib/env";
import { clientInfo } from "@/lib/auth/request";
import { countAttempt, peek, rules } from "@/lib/auth/rate-limit";
import { tooMany } from "@/lib/auth/http";

export async function GET(req: NextRequest) {
  const ipKey = clientInfo(req).ip ?? "unknown";
  const limit = await peek(rules.nearbyIp, ipKey);
  if (limit.blocked) return tooMany(limit.retryAfter);
  await countAttempt(rules.nearbyIp, ipKey);

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

  // Matched on the public map points only, so the answer tells nothing the map doesn't.
  const groups = await withAccess({}, (tx) => openGroupsNear(tx, category, lat, lng));
  const details = publicDetails();
  return NextResponse.json(
    groups.slice(0, 5).map((g) => ({
      id: g.id,
      status: g.status,
      created_at: g.created_at,
      count: g.count,
      description: details ? readDescription(g.id, g.description) : "",
    })),
    { headers: { "Cache-Control": "no-store" } }
  );
}
