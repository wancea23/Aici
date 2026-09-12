import postgres from "postgres";

const url = process.env.DATABASE_URL!;

// Cloud providers require TLS. Local Docker does not.
const useSsl = /sslmode=require|neon\.tech|supabase/.test(url);

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

const sql =
  globalForDb.sql ??
  postgres(url, {
    max: 10,
    ssl: useSsl ? "require" : undefined,
    prepare: false,
    // Postgres notices like "already exists, skipping" are not errors, keep them out of the console.
    onnotice: () => {},
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

export default sql;
