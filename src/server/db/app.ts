import postgres from "postgres";

// Same database as owner.ts, but authenticated as app_data instead of the owner, so row
// level security (see db/init.sql) actually applies to what this connection can do. Built by
// swapping the credentials on DATABASE_URL rather than a second full connection string, so it
// can never point at a different host or database by a copy-paste mistake.
function appDataUrl() {
  const url = new URL(process.env.DATABASE_URL!);
  url.username = "app_data";
  url.password = process.env.APP_DB_PASSWORD ?? "";
  return url.toString();
}

const globalForAppDb = globalThis as unknown as { appSql?: ReturnType<typeof postgres> };

// Built lazily, on first real use, not at module load: Next.js imports every route file while
// building the app, just to read its config, and a strict env var lookup there would crash the
// build itself instead of just failing a request — this way it only ever runs when a request
// actually needs the database, by which point the environment is guaranteed to be there.
function getAppSql() {
  if (globalForAppDb.appSql) return globalForAppDb.appSql;

  const url = appDataUrl();
  // Cloud providers require TLS. Local Docker does not.
  const useSsl = /sslmode=require|neon\.tech|supabase/.test(url);

  const client = postgres(url, {
    max: 10,
    ssl: useSsl ? "require" : undefined,
    prepare: false,
    onnotice: () => {},
  });

  // Cached in production too: without it every call opened a new pool that never closed.
  globalForAppDb.appSql = client;
  return client;
}

export default getAppSql;
