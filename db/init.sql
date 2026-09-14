create extension if not exists postgis;

-- Description and the exact location are encrypted by the app (AES-256-GCM, key in .env).
-- geom only keeps the point rounded to about 100 m, for map queries and duplicate checks.
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null default '',
  location text not null,
  status text not null default 'nou',
  geom geometry(Point, 4326) not null,
  -- Set when the report repeats an earlier one. It points at the first report of the group.
  duplicate_of uuid references reports (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists reports_geom_idx on reports using gist (geom);
create index if not exists reports_created_idx on reports (created_at desc);
create index if not exists reports_duplicate_idx on reports (duplicate_of);

-- The cleaned webp of each report, encrypted. In the database for now, object storage later.
create table if not exists report_photos (
  report_id uuid primary key references reports (id) on delete cascade,
  data bytea not null,
  created_at timestamptz not null default now()
);

-- Staff accounts, made by invitation only.
create table if not exists staff_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  role text not null check (role in ('operator', 'admin')),
  is_active boolean not null default true,
  force_password_reset boolean not null default false,
  password_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists staff_users_email_idx on staff_users (lower(email));

-- The cookie holds the token, the database only its SHA-256.
create table if not exists staff_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references staff_users (id) on delete cascade,
  token_hash text not null unique,
  ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  idle_expires_at timestamptz not null,
  expires_at timestamptz not null
);

create index if not exists staff_sessions_user_idx on staff_sessions (user_id);

-- Invitations and password reset links. Only the hash of the token is kept.
create table if not exists staff_credential_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references staff_users (id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  token_type text not null check (token_type in ('invite', 'password_reset')),
  role text check (role in ('operator', 'admin')),
  created_by uuid references staff_users (id) on delete set null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists staff_rate_limits (
  rate_key text primary key,
  attempts integer not null default 0,
  first_attempt_at timestamptz not null default now(),
  last_attempt_at timestamptz not null default now(),
  next_allowed_at timestamptz
);

create table if not exists staff_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references staff_users (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  status text not null check (status in ('success', 'failure')),
  ip text,
  user_agent text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists staff_audit_created_idx on staff_audit_log (created_at desc);
create index if not exists staff_audit_actor_idx on staff_audit_log (actor_id);

-- The audit log is append only.
create or replace function staff_audit_log_append_only() returns trigger as $$
begin
  raise exception 'staff_audit_log is append only';
end;
$$ language plpgsql;

create or replace trigger staff_audit_log_no_change
  before update or delete on staff_audit_log
  for each row execute function staff_audit_log_append_only();

create or replace trigger staff_audit_log_no_truncate
  before truncate on staff_audit_log
  for each statement execute function staff_audit_log_append_only();

-- Citizen accounts. A row only exists once the email is confirmed, see citizen_signups.
-- The email is encrypted by the app, email_hash is a keyed hash of it to look it up by.
create table if not exists citizen_users (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null unique,
  email text not null,
  password_hash text not null,
  email_verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A sign up waiting for its email link, with the password chosen for it.
-- Deleted once it is used or expired.
create table if not exists citizen_signups (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  email text not null,
  password_hash text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists citizen_signups_email_idx on citizen_signups (email_hash);

-- Like staff_sessions, without the address and browser. Nothing here needs them.
create table if not exists citizen_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references citizen_users (id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  idle_expires_at timestamptz not null,
  expires_at timestamptz not null
);

create index if not exists citizen_sessions_user_idx on citizen_sessions (user_id);
