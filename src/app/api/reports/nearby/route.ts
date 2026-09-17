import { NextRequest, NextResponse } from "next/server";
import { nearbyInput } from "@/features/reports/validation";
import { readDescription } from "@/features/reports/queries";
import { openGroupsNear } from "@/features/reports/duplicates";
import { withAccess } from "@/server/db/access";
import { publicDetails } from "@/server/env";
import { clientInfo } from "@/server/http/request";
import { countAttempt, peek, rules } from "@/server/security/rate-limit";
import { tooMany } from "@/server/http/responses";

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
