create extension if not exists postgis;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  password_hash text,
  role text not null default 'cetatean',
  created_at timestamptz not null default now()
);

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
