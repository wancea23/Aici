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
