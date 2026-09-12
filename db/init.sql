create extension if not exists postgis;

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null default '',
  status text not null default 'nou',
  geom geometry(Point, 4326) not null,
  created_at timestamptz not null default now()
);

create index if not exists reports_geom_idx on reports using gist (geom);
create index if not exists reports_created_idx on reports (created_at desc);

-- The cleaned webp of each report. In the database for now, object storage later.
create table if not exists report_photos (
  report_id uuid primary key references reports (id) on delete cascade,
  data bytea not null,
  created_at timestamptz not null default now()
);

-- Staff accounts. Citizens report without an account.
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
-- A session stays limited to the MFA pages until mfa_verified is true.
create table if not exists staff_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references staff_users (id) on delete cascade,
  token_hash text not null unique,
  mfa_verified boolean not null default false,
  challenge text,
  challenge_expires_at timestamptz,
  ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  idle_expires_at timestamptz not null,
  expires_at timestamptz not null
);

create index if not exists staff_sessions_user_idx on staff_sessions (user_id);

create table if not exists staff_mfa_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references staff_users (id) on delete cascade,
  mfa_type text not null check (mfa_type in ('totp', 'webauthn')),
  label text not null default '',
  -- TOTP secret, encrypted with AES-256-GCM
  encrypted_secret text,
  secret_iv text,
  secret_tag text,
  -- Last accepted 30 second step, so a code can't be used twice
  totp_last_step bigint,
  webauthn_credential_id text unique,
  webauthn_public_key bytea,
  webauthn_counter bigint not null default 0,
  webauthn_transports text[],
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists staff_mfa_user_idx on staff_mfa_credentials (user_id);

create table if not exists staff_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references staff_users (id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists staff_recovery_user_idx on staff_recovery_codes (user_id) where used_at is null;

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
