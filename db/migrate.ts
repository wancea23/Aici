// Brings an existing database up to date with this version of the app. Safe to run twice.
//   npm run db:migrate
// Run it once everyone is on this version: older code can't read encrypted reports.
import sql from "@/server/db/owner";
import { encryptBytes, encryptText, isEncryptedBytes, isEncryptedText } from "@/server/security/crypto";

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
  await sql`
    create table if not exists citizen_password_resets (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references citizen_users (id) on delete cascade,
      token_hash text not null unique,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists citizen_password_resets_user_idx on citizen_password_resets (user_id)`;

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

  // A repeated report points at the first one of its group.
  await sql`
    alter table reports
      add column if not exists duplicate_of uuid references reports (id) on delete set null
  `;
  await sql`create index if not exists reports_duplicate_idx on reports (duplicate_of)`;

  // Who reported it, for citizens who were signed in. citizen_users already exists by here.
  await sql`
    alter table reports
      add column if not exists citizen_id uuid references citizen_users (id) on delete set null
  `;
  await sql`create index if not exists reports_citizen_idx on reports (citizen_id)`;

  // app_data: the role ordinary app queries run as, so row-level security actually applies
  // (it never applies to the owner role this script itself connects as). Structure and
  // policies mirror db/init.sql exactly; see the comments there for what each one does.
  await sql`
    do $$
    begin
      if not exists (select 1 from pg_roles where rolname = 'app_data') then
        create role app_data login;
      end if;
    end $$
  `;
  await sql`grant usage on schema public to app_data`;
  await sql`grant select, insert, update on reports to app_data`;
  await sql`grant select, insert on report_photos to app_data`;
  await sql`alter table reports enable row level security`;
  await sql`alter table report_photos enable row level security`;
  await sql`
    do $$
    begin
      if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'reports_staff_all') then
        create policy reports_staff_all on reports for all
          using (current_setting('app.is_staff', true) = 'true')
          with check (current_setting('app.is_staff', true) = 'true');
      end if;
      if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'reports_owner_select') then
        create policy reports_owner_select on reports for select
          using (
            citizen_id is not null
            and citizen_id = nullif(current_setting('app.citizen_id', true), '')::uuid
          );
      end if;
      if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'reports_public_select') then
        create policy reports_public_select on reports for select
          using (status <> 'respins');
      end if;
      if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'reports_insert') then
        create policy reports_insert on reports for insert
          with check (
            citizen_id is null
            or citizen_id = nullif(current_setting('app.citizen_id', true), '')::uuid
          );
      end if;
      if not exists (select 1 from pg_policies where tablename = 'report_photos' and policyname = 'report_photos_select') then
        create policy report_photos_select on report_photos for select
          using (
            exists (
              select 1 from reports r
              where r.id = report_photos.report_id
                and (
                  current_setting('app.is_staff', true) = 'true'
                  or (r.citizen_id is not null and r.citizen_id = nullif(current_setting('app.citizen_id', true), '')::uuid)
                  or (current_setting('app.public_details', true) = 'true' and r.status <> 'respins')
                )
            )
          );
      end if;
      if not exists (select 1 from pg_policies where tablename = 'report_photos' and policyname = 'report_photos_insert') then
        create policy report_photos_insert on report_photos for insert
          with check (
            exists (
              select 1 from reports r
              where r.id = report_photos.report_id
                and (r.citizen_id is null or r.citizen_id = nullif(current_setting('app.citizen_id', true), '')::uuid)
            )
          );
      end if;
    end $$
  `;

  // The history of each report, the same as in init.sql.
  await sql`
    create table if not exists report_events (
      id uuid primary key,
      report_id uuid not null references reports (id) on delete cascade,
      status text not null,
      previous_status text not null,
      note text,
      staff_id uuid references staff_users (id) on delete set null,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists report_events_report_idx on report_events (report_id, created_at)`;
  await sql`
    create or replace function report_events_append_only() returns trigger as $$
    begin
      raise exception 'report_events is append only';
    end;
    $$ language plpgsql
  `;
  await sql`
    create or replace trigger report_events_no_change
      before update on report_events
      for each row execute function report_events_append_only()
  `;
  await sql`grant select, insert on report_events to app_data`;
  await sql`alter table report_events enable row level security`;
  await sql`
    do $$
    begin
      if not exists (select 1 from pg_policies where tablename = 'report_events' and policyname = 'report_events_staff') then
        create policy report_events_staff on report_events for all
          using (current_setting('app.is_staff', true) = 'true')
          with check (current_setting('app.is_staff', true) = 'true');
      end if;
      if not exists (select 1 from pg_policies where tablename = 'report_events' and policyname = 'report_events_owner_select') then
        create policy report_events_owner_select on report_events for select
          using (
            exists (
              select 1 from reports r
              where r.id = report_events.report_id
                and r.citizen_id = nullif(current_setting('app.citizen_id', true), '')::uuid
            )
          );
      end if;
    end $$
  `;

  // Only this script can actually set app_data's password, from a secret never committed.
  // Skipped, not failed, when it's missing — a later, unrelated migration shouldn't need it
  // just because nobody has generated it yet. ALTER ROLE takes no bind parameter for the
  // password, so quote_literal builds one safely instead of splicing the value in by hand.
  if (process.env.APP_DB_PASSWORD) {
    const [{ quoted }] = await sql<{ quoted: string }[]>`
      select quote_literal(${process.env.APP_DB_PASSWORD}) as quoted
    `;
    await sql.unsafe(`alter role app_data password ${quoted}`);
    console.log("app_data password set from APP_DB_PASSWORD.");
  } else {
    console.log("APP_DB_PASSWORD is not set — app_data has no usable password yet.");
  }

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
