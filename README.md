# Aici

See it. Report it. Fix it.

Aici lets a resident report an urban problem (a pothole, a broken streetlight, dumped
garbage) with a photo and a location, and lets a city hall see and handle those reports.

University project for the course Development of Secure Applications.

## Stack

- Next.js 16 with React 19 and TypeScript for the app
- Tailwind for the interface, lucide for the icons
- PostgreSQL with PostGIS for the data, hosted on Neon. Report photos are stored in the database too
- postgres.js for parameterized queries, zod for input validation
- sharp to clean every uploaded photo (EXIF and GPS removed, re encoded to WebP)
- MapLibre GL for the map, with OpenFreeMap tiles
- Staff login: Argon2id password hashing (@node-rs/argon2), passkeys (SimpleWebAuthn), authenticator
  app codes (Oslo OTP) and an ALTCHA proof of work against password guessing
- node:test with tsx for the tests, ESLint 9 for linting

## Running it

You need Node 20.9 or newer.

1. Install dependencies:

   npm install

2. Create your `.env` with the database connection. The database is a shared Neon project.
   The easiest way is the Neon CLI, which writes the connection into `.env` for you:

   npm i -g neon
   neon login
   neon link --project-id raspy-star-63740105 --branch production

   If you prefer, ask a teammate for the connection string and put it in `.env` by hand:

   DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

3. Add the staff login settings from `.env.example` to your `.env`. The pepper and the MFA
   key must be the same for everyone on the team, because the database is shared, so ask a
   teammate for them.

4. Run it:

   npm run dev

Open the address it prints. The report form is the home page, the city hall view is at
`/panou` and needs a staff account.

The tables already exist on the shared `production` branch. If you point at your own
empty database, create them once by running the SQL in `db/init.sql`.

## Staff accounts

Citizens report without an account. City hall staff sign in at `/login` with a password
and a second factor: a passkey, or an authenticator app, with ten recovery codes as a backup.

1. Create the first admin from the terminal. The password is asked for without showing it:

   npm run staff:create -- --email=you@example.com --role=admin

2. Sign in at `/login`. The first sign in asks you to set up the second factor and shows the
   recovery codes once.

3. Invite the rest of the team from `/admin`. There is no email service yet, so the page gives
   you a link to pass on. An invitation lasts 48 hours. The admin can also make a password
   reset link (valid 15 minutes), ask for a new password, reset someone's second factor after
   a lost phone, change roles and deactivate accounts.

Passkeys only work on the address in `WEBAUTHN_ORIGIN`, which is `http://localhost:3000` in
development.

Operators see the panel and change report status. Admins can also manage staff and read the
audit log.

## Tests

   npm test

## Layout

- `db/init.sql` sets up the tables and PostGIS
- `src/app` holds the pages and the API routes
- `src/lib` holds the database connection, input validation, and the image pipeline
- `src/lib/auth` holds staff login: passwords, sessions, MFA, throttling, the audit log
- `src/components` holds the report form, the city hall map, and the login screens
- `scripts/create-staff.ts` creates a staff account from the terminal
- `research/` holds the domain, legal, security, and stack research behind the project

## Security notes

Uploaded photos are re encoded on the server, which strips EXIF and GPS metadata before
anything is stored. Inputs are validated before they reach the database, database queries
are parameterized, and the connection to the database uses TLS.

Staff login follows `research/c5_auth_design_report.md`. Passwords are at least 15
characters, checked against known breaches through the Have I Been Pwned range API, and
stored as Argon2id hashes of an HMAC with a secret pepper. Sessions live in the database,
which keeps only a SHA-256 of the cookie token. A session ends after 30 minutes without
activity or 12 hours in total, and the token changes after the second factor. The cookie is
HttpOnly and SameSite=Lax, with the `__Host-` prefix in production. Every page and API route
checks the session against the database, the proxy only redirects early. Requests that change
something must come from our own origin. Repeated failures slow down instead of locking the
account, and after several failures the login form asks for an ALTCHA proof of work. Staff
join by invitation only, and every sign in, account change and report status change is
written to an audit log that the database refuses to edit or delete.

Rate limiting on uploads and virus scanning come in later work.
