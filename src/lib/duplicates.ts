import "server-only";
import type postgres from "postgres";

// Two open reports of the same category closer than this are taken as the same problem.
export const DUPLICATE_METERS = 25;

// The check only looks at the points the public map shows, rounded to 3 decimals, which moves a
// point up to about 67 m here. So an answer tells nothing the map doesn't, and a real repeat
// within DUPLICATE_METERS still always has its public point within this distance.
const MATCH_METERS = DUPLICATE_METERS + 70;

export type NearbyGroup = {
  id: string;
  status: string;
  description: string;
  created_at: Date;
  count: number;
};

// Open groups of this category whose public point is near, closest first. A group is its first
// report plus the ones pointing at it with duplicate_of, and it has the first report's status.
// Takes the caller's own connection (see withAccess in lib/db-access.ts) so this reads under
// whatever identity, if any, that caller already set for row-level security.
export async function openGroupsNear(
  sql: postgres.Sql,
  category: string,
  lat: number,
  lng: number
): Promise<NearbyGroup[]> {
  const here = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
  return sql<NearbyGroup[]>`
    with public_points as (
      select id, duplicate_of,
             ST_SetSRID(ST_MakePoint(
               round(ST_X(geom)::numeric, 3)::float8,
               round(ST_Y(geom)::numeric, 3)::float8
             ), 4326)::geography as point
      from reports
      where category = ${category} and status in ('nou', 'in_lucru')
    ),
    near as (
      select coalesce(duplicate_of, id) as root, min(ST_Distance(point, ${here})) as meters
      from public_points
      where ST_DWithin(point, ${here}, ${MATCH_METERS})
      group by 1
    )
    select r.id, r.status, r.description, r.created_at,
           1 + (select count(*) from reports m where m.duplicate_of = r.id)::int as count
    from near
    join reports r on r.id = near.root
    where r.duplicate_of is null and r.status in ('nou', 'in_lucru')
    order by near.meters
    limit 5
  `;
}
