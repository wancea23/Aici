import sql from "@/lib/db";
import { decryptText } from "@/lib/crypto";

export type Report = {
  id: string;
  category: string;
  description: string;
  status: string;
  lat: number;
  lng: number;
  created_at: string;
};

export type PublicReport = Pick<Report, "id" | "category" | "status" | "lat" | "lng" | "created_at"> & {
  description?: string;
};

// What the public map shows: the point rounded to about 100 m even for old rows, and no
// rejected reports. The description only comes along while PUBLIC_DETAILS is on.
export async function listPublicReports(details: boolean, limit = 500): Promise<PublicReport[]> {
  const rows = await sql`
    select id, category, status, description,
           round(ST_Y(geom)::numeric, 3)::float8 as lat,
           round(ST_X(geom)::numeric, 3)::float8 as lng,
           created_at
    from reports
    where status <> 'respins'
    order by created_at desc
    limit ${limit}
  `;
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    status: r.status,
    lat: r.lat,
    lng: r.lng,
    created_at: new Date(r.created_at).toISOString(),
    ...(details ? { description: readDescription(r.id, r.description) } : {}),
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

export async function listReports(limit = 100): Promise<Report[]> {
  const rows = await sql`
    select id, category, description, location, status,
           ST_Y(geom) as lat, ST_X(geom) as lng, created_at
    from reports
    order by created_at desc
    limit ${limit}
  `;

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
    };
  });
}
