import { withAccess } from "@/lib/db-access";
import { decryptText } from "@/lib/crypto";

export type Report = {
  id: string;
  category: string;
  description: string;
  status: string;
  lat: number;
  lng: number;
  created_at: string;
  // reports grouped under this one, oldest first
  members: string[];
};

export type PublicReport = Pick<Report, "id" | "category" | "status" | "lat" | "lng" | "created_at"> & {
  description?: string;
  // how many reports the pin stands for, itself included
  count: number;
};

// What the public map shows: the point rounded to about 100 m even for old rows, no
// rejected reports, and one pin per group. The description only comes along while
// PUBLIC_DETAILS is on. No identity is set, so row-level security's public policy is what
// actually keeps rejected reports out, same as the explicit where clause below.
export async function listPublicReports(details: boolean, limit = 500): Promise<PublicReport[]> {
  const rows = await withAccess({}, (sql) => sql`
    select r.id, r.category, r.status, r.description,
           round(ST_Y(r.geom)::numeric, 3)::float8 as lat,
           round(ST_X(r.geom)::numeric, 3)::float8 as lng,
           r.created_at,
           1 + (select count(*) from reports m where m.duplicate_of = r.id)::int as count
    from reports r
    where r.status <> 'respins' and r.duplicate_of is null
    order by r.created_at desc
    limit ${limit}
  `);
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    status: r.status,
    lat: r.lat,
    lng: r.lng,
    created_at: new Date(r.created_at).toISOString(),
    count: r.count,
    ...(details ? { description: readDescription(r.id, r.description) } : {}),
  }));
}

export type CitizenReport = Pick<Report, "id" | "category" | "description" | "status" | "created_at">;

// One citizen's own submissions, most recent first. Status already reflects the whole
// group (see the status route), so a report grouped under another still shows correctly.
// Scoped by citizen_id here and, as a second line of defense, by row-level security too.
export async function listReportsForCitizen(citizenId: string, limit = 100): Promise<CitizenReport[]> {
  const rows = await withAccess({ citizenId }, (sql) => sql`
    select id, category, description, status, created_at
    from reports
    where citizen_id = ${citizenId}
    order by created_at desc
    limit ${limit}
  `);
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    description: readDescription(r.id, r.description),
    status: r.status,
    created_at: new Date(r.created_at).toISOString(),
  }));
}

// One row that can't be decrypted shouldn't take a whole page down.
export function readDescription(id: string, value: string) {
  try {
    return decryptText(value, `report:${id}:description`);
  } catch (err) {
    console.error("could not decrypt report", id, err);
    return "";
  }
}

// One entry per group, its first report, with the ids of the ones grouped under it. Staff
// only — the caller must have already checked that with requireStaffApi/requireStaffPage.
export async function listReports(limit = 100): Promise<Report[]> {
  const rows = await withAccess({ staff: true }, (sql) => sql`
    select r.id, r.category, r.description, r.location, r.status,
           ST_Y(r.geom) as lat, ST_X(r.geom) as lng, r.created_at,
           array(
             select m.id::text from reports m where m.duplicate_of = r.id order by m.created_at
           ) as members
    from reports r
    where r.duplicate_of is null
    order by r.created_at desc
    limit ${limit}
  `);

  // Plain objects with a string date, so they can be handed to client components.
  return rows.map((r) => {
    let description = "";
    let lat: number = r.lat;
    let lng: number = r.lng;
    try {
      description = decryptText(r.description, `report:${r.id}:description`);
      // Rows from before encryption have no location yet and use the point in geom.
      if (r.location) {
        [lat, lng] = decryptText(r.location, `report:${r.id}:location`).split(",").map(Number);
      }
    } catch (err) {
      // One broken row shouldn't take the whole panel down.
      console.error("could not decrypt report", r.id, err);
    }
    return {
      id: r.id,
      category: r.category,
      description,
      status: r.status,
      lat,
      lng,
      created_at: new Date(r.created_at).toISOString(),
      members: r.members,
    };
  });
}
