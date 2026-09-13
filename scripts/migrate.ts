// Brings an existing database up to date with this version of the app. Safe to run twice.
//   npm run db:migrate
// Run it once everyone is on this version: older code can't read encrypted reports.
import sql from "@/lib/db";
import { encryptBytes, encryptText, isEncryptedBytes, isEncryptedText } from "@/lib/crypto";

const coarse = (x: number) => Math.round(x * 1000) / 1000;

async function main() {
  // Citizen accounts, the same tables as in init.sql.
  await sql`
    create table if not exists citizen_users (
      id uuid primary key default gen_random_uuid(),
      email_hash text not null unique,
      email text not null,
      password_hash text not null,
      email_verified_at timestamptz not null default now(),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists citizen_signups (
      id uuid primary key default gen_random_uuid(),
      email_hash text not null,
      email text not null,
      password_hash text not null,
      token_hash text not null unique,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists citizen_signups_email_idx on citizen_signups (email_hash)`;
  await sql`
    create table if not exists citizen_sessions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references citizen_users (id) on delete cascade,
      token_hash text not null unique,
      created_at timestamptz not null default now(),
      last_active_at timestamptz not null default now(),
      idle_expires_at timestamptz not null,
      expires_at timestamptz not null
    )
  `;
  await sql`create index if not exists citizen_sessions_user_idx on citizen_sessions (user_id)`;

  // The encrypted location column, and what the removed second login step left behind.
  await sql`alter table reports add column if not exists location text`;
  await sql`drop table if exists staff_mfa_credentials`;
  await sql`drop table if exists staff_recovery_codes`;
  await sql`
    alter table staff_sessions
      drop column if exists mfa_verified,
      drop column if exists challenge,
      drop column if exists challenge_expires_at
  `;

  const reports = await sql`
    select id, description, location, ST_Y(geom) as lat, ST_X(geom) as lng from reports
  `;

  let changed = 0;
  for (const r of reports) {
    const [photo] = await sql`select data from report_photos where report_id = ${r.id}`;
    const needText = !isEncryptedText(r.description);
    const needLocation = !r.location;
    const needPhoto = Boolean(photo) && !isEncryptedBytes(photo.data);
    if (!needText && !needLocation && !needPhoto) continue;

    await sql.begin(async (tx) => {
      if (needText) {
        await tx`
          update reports set description = ${encryptText(r.description, `report:${r.id}:description`)}
          where id = ${r.id}
        `;
      }
      // The exact point moves into the encrypted column, geom keeps it rounded.
      if (needLocation) {
        await tx`
          update reports
          set location = ${encryptText(`${r.lat},${r.lng}`, `report:${r.id}:location`)},
              geom = ST_SetSRID(ST_MakePoint(${coarse(r.lng)}, ${coarse(r.lat)}), 4326)
          where id = ${r.id}
        `;
      }
      if (needPhoto) {
        await tx`
          update report_photos set data = ${encryptBytes(photo.data, `report:${r.id}:photo`)}
          where report_id = ${r.id}
        `;
      }
    });
    changed++;
  }

  await sql`alter table reports alter column location set not null`;
  console.log(`${reports.length} reports checked, ${changed} encrypted now.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
