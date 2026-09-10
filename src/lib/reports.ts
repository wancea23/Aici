import sql from "@/lib/db";

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
    select id, category, description, status,
           ST_Y(geom) as lat, ST_X(geom) as lng, created_at
    from reports
    order by created_at desc
    limit ${limit}
  `;

  // Plain objects with a string date, so they can be handed to client components.
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    description: r.description,
    status: r.status,
    lat: r.lat,
    lng: r.lng,
    created_at: new Date(r.created_at).toISOString(),
  }));
}
