import "server-only";
import sql from "@/server/db/owner";
import { withAccess } from "@/server/db/access";
import { decryptText, emailIndex } from "@/server/security/crypto";

// Everything the app holds about one citizen, for the copy they can download and for the
// deletion of their account. Reports survive a deletion without the person attached to them,
// which the foreign key on reports.citizen_id already does (on delete set null).

type EventRow = { id: string; status: string; previous: string; note: string | null; at: string };

export type ReportRow = {
  id: string;
  category: string;
  description: string;
  location: string | null;
  status: string;
  created_at: string;
  duplicate_of: string | null;
  public_lat: number;
  public_lng: number;
  has_photo: boolean;
  events: EventRow[];
};

export type ExportedReport = {
  id: string;
  category: string;
  status: string;
  description: string;
  created_at: string;
  // the point as you placed it, kept encrypted in the database
  exact_location: { lat: number; lng: number } | null;
  // the rounded point the public map shows, about 100 m off
  public_location: { lat: number; lng: number };
  photo: string | null;
  grouped_under: string | null;
  history: { at: string; status: string; previous: string; message: string }[];
};

export type CitizenExport = {
  about: string;
  exported_at: string;
  account: { email: string; created_at: string; email_verified_at: string };
  sessions: { created_at: string; last_active_at: string; expires_at: string }[];
  reports: ExportedReport[];
};

const ABOUT =
  "Toate datele pe care Aici le are despre contul tău. Jurnalul de securitate (autentificări, " +
  "schimbări de parolă) se păstrează separat și nu este inclus aici.";

// A value that can't be decrypted shouldn't take the whole export down.
function read(value: string, context: string) {
  try {
    return decryptText(value, context);
  } catch (err) {
    console.error("could not decrypt", context, err);
    return "";
  }
}

export function shapeReport(row: ReportRow): ExportedReport {
  const exact = row.location ? read(row.location, `report:${row.id}:location`) : "";
  const [lat, lng] = exact.split(",").map(Number);

  return {
    id: row.id,
    category: row.category,
    status: row.status,
    description: read(row.description, `report:${row.id}:description`),
    created_at: new Date(row.created_at).toISOString(),
    exact_location: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
    public_location: { lat: row.public_lat, lng: row.public_lng },
    photo: row.has_photo ? `/api/media/${row.id}` : null,
    grouped_under: row.duplicate_of,
    history: row.events.map((e) => ({
      at: new Date(e.at).toISOString(),
      status: e.status,
      previous: e.previous,
      message: e.note ? read(e.note, `event:${e.id}:note`) : "",
    })),
  };
}

// Scoped by the id from the session everywhere, never by anything in the request. The
// reports go through the restricted connection, so row-level security checks it again.
export async function exportCitizenData(citizenId: string): Promise<CitizenExport> {
  const [[account], sessions, reports] = await Promise.all([
    sql<{ email: string; created_at: string; email_verified_at: string }[]>`
      select email, created_at, email_verified_at from citizen_users where id = ${citizenId}
    `,
    sql<{ created_at: string; last_active_at: string; expires_at: string }[]>`
      select created_at, last_active_at, expires_at from citizen_sessions
      where user_id = ${citizenId}
      order by created_at
    `,
    withAccess({ citizenId }, (tx) => tx<ReportRow[]>`
      select r.id, r.category, r.description, r.location, r.status, r.created_at, r.duplicate_of,
             ST_Y(r.geom) as public_lat, ST_X(r.geom) as public_lng,
             exists (select 1 from report_photos p where p.report_id = r.id) as has_photo,
             coalesce((
               select json_agg(json_build_object(
                 'id', e.id, 'status', e.status, 'previous', e.previous_status,
                 'note', e.note, 'at', e.created_at
               ) order by e.created_at)
               from report_events e where e.report_id = r.id
             ), '[]') as events
      from reports r
      where r.citizen_id = ${citizenId}
      order by r.created_at
    `),
  ]);

  if (!account) throw new Error("citizen not found");

  return {
    about: ABOUT,
    exported_at: new Date().toISOString(),
    account: {
      email: read(account.email, `citizen:${citizenId}:email`),
      created_at: new Date(account.created_at).toISOString(),
      email_verified_at: new Date(account.email_verified_at).toISOString(),
    },
    sessions: sessions.map((s) => ({
      created_at: new Date(s.created_at).toISOString(),
      last_active_at: new Date(s.last_active_at).toISOString(),
      expires_at: new Date(s.expires_at).toISOString(),
    })),
    reports: reports.map(shapeReport),
  };
}

// Deleting the account row takes the sessions and the reset links with it (on delete
// cascade) and empties citizen_id on the reports (on delete set null), so the city hall
// keeps the case and the map keeps the pin. A sign up still waiting for its email link
// holds the address and a password hash too, so it goes as well.
export async function deleteCitizenAccount(citizenId: string, email: string) {
  await sql.begin(async (tx) => {
    await tx`delete from citizen_signups where email_hash = ${emailIndex(email)}`;
    await tx`delete from citizen_users where id = ${citizenId}`;
  });
}
