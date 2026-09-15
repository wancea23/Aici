import postgres from "postgres";

// Same database as lib/db.ts, but authenticated as app_data instead of the owner, so row
// level security (see db/init.sql) actually applies to what this connection can do. Built by
// swapping the credentials on DATABASE_URL rather than a second full connection string, so it
// can never point at a different host or database by a copy-paste mistake.
function appDataUrl() {
  const url = new URL(process.env.DATABASE_URL!);
  url.username = "app_data";
  url.password = process.env.APP_DB_PASSWORD ?? "";
  return url.toString();
}

const url = appDataUrl();

// Cloud providers require TLS. Local Docker does not.
const useSsl = /sslmode=require|neon\.tech|supabase/.test(url);

const globalForAppDb = globalThis as unknown as { appSql?: ReturnType<typeof postgres> };

const appSql =
  globalForAppDb.appSql ??
  postgres(url, {
    max: 10,
    ssl: useSsl ? "require" : undefined,
    prepare: false,
    onnotice: () => {},
  });

if (process.env.NODE_ENV !== "production") {
  globalForAppDb.appSql = appSql;
}

export default appSql;
