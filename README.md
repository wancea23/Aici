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
- AES-256-GCM from Node's crypto module to encrypt citizen data before it reaches the database
- MapLibre GL for the map, with OpenFreeMap tiles
- Login for staff and citizens: Argon2id password hashing (@node-rs/argon2) and an ALTCHA proof
  of work against password guessing and bots
- nodemailer to send the sign up emails over SMTP with TLS
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

3. Add the secrets from `.env.example` to your `.env`. `STAFF_PASSWORD_PEPPER`,
   `DATA_ENCRYPTION_KEY` and `APP_DB_PASSWORD` must be the same for everyone on the team,
   because the database is shared, so ask a teammate for them. With a different data key the
   photos and descriptions can't be read, and with a different `APP_DB_PASSWORD` the app can't
   connect as `app_data` at all (see Row-level security). The email settings can stay empty
   while you develop, see Citizen accounts.

4. Run it:

   npm run dev

Open the address it prints. The report form is the home page and the public map is at
`/harta`. The city hall view is at `/panou` and needs a staff account.

The tables already exist on the shared `production` branch. If you point at your own
empty database, create them once by running the SQL in `db/init.sql`. When a new version
changes the database, run `npm run db:migrate` once. Running it again does no harm.

## Citizen accounts

Citizens can still report without an account. Whoever wants one signs up at `/inregistrare`
with an email and a password, and gets a link by email. The account only exists once they open
that link, and the page then says the email is verified. They sign in at `/conectare` with the
password chosen at sign up, and see their account at `/profil`.

Sending email needs an SMTP account in `.env`, see `.env.example`. Gmail works with an app
password. Without `SMTP_HOST`, `npm run dev` prints every email with its link in the terminal,
so the whole flow can be tried without sending anything. In production `APP_URL` has to be set
as well, the links in the emails are built from it.

A citizen who forgets the password asks for a link at `/forgot-password`. The link lasts 15
minutes, works once and opens `/new-password`, where the new password follows the same rules as
at sign up. Saving it signs the account out on every device, and an email tells the owner that
the password changed.

## Staff accounts

City hall staff sign in at `/login` with their email and password.

1. Create the first admin from the terminal. The password is asked for without showing it:

   npm run staff:create you@example.com admin

2. Sign in at `/login`.

3. Invite the rest of the team from `/admin`. The page gives you a link to pass on. An
   invitation lasts 48 hours. The admin can also make a password reset link (valid 15
   minutes), ask for a new password, change roles and deactivate accounts.

Operators see the panel and change report status. Admins can also manage staff and read the
audit log.

## Report history

Picking a report in `/panou` opens its deadline, its history and a form to change the status
and write a message for the citizen. Every status change and every message becomes a line in
`report_events`, one for each report in the group. A rejection needs a reason.

The deadline is 30 calendar days from the day of the report, the general term for petitions in
the Administrative Code (art. 60). The panel shows the days left on every open report and counts
the overdue ones. A report on Aici doesn't carry everything a formal petition needs, so the
count follows the legal term as a service target.

Citizens who reported from their account see each report's history on `/profil` and get an
email when something changes. The email only names the category, the day and the new status and
links to `/profil`, so the message itself stays behind the login. One citizen gets at most 10 of
these emails an hour.

## Tests

   npm test

## Layout

- `db/init.sql` sets up the tables and PostGIS
- `src/app` holds the pages and the API routes
- `src/lib` holds the database connection, input validation, the image pipeline, the
  encryption of citizen data, and `mail.ts` which sends email
- `src/lib/auth` holds login for staff and citizens: passwords, sessions, throttling, the audit log
- `src/components` holds the report form, the city hall map, and the login and sign up screens
- `scripts/create-staff.ts` creates a staff account from the terminal, `scripts/migrate.ts`
  updates an existing database
- `research/` holds the domain, legal, security, and stack research behind the project

## Security notes

Uploaded photos are re encoded on the server, which strips EXIF and GPS metadata before
anything is stored. Inputs are validated before they reach the database, database queries
are parameterized, and the connection to the database uses TLS.

Citizen data is encrypted by the app before it is stored: the photo, the description and the
exact location, each with AES-256-GCM and bound to its own report. The key lives in `.env`,
never in the database, so a dump, a backup or an SQL injection only yields ciphertext. The
database itself keeps the location rounded to about 100 m.

Staff login follows `research/c5_auth_design_report.md`, without the second factor. Passwords
are at least 15 characters, checked against known breaches through the Have I Been Pwned
range API, and stored as Argon2id hashes of an HMAC with a secret pepper. Sessions live in
the database, which keeps only a SHA-256 of the cookie token. A session ends after 30 minutes
without activity or 12 hours in total. The cookie is HttpOnly and SameSite=Lax, with the
`__Host-` prefix in production. Every page and API route checks the session against the
database, the proxy only redirects early. Requests that change something must come from our
own origin. Repeated failures slow down instead of locking the account, and after several
failures the login form asks for an ALTCHA proof of work. Staff join by invitation only, and
every sign in, account change and report status change is written to an audit log that the
database refuses to edit or delete.

Citizen accounts have their own tables and their own cookie, so a citizen session can never
open a staff page. They use the same hashing, breach check, throttling and origin checks as
staff, with the password rules people know from other sites: at least 8 characters, with an
upper case letter, a lower case letter and a special character. A sign up waits in its own
table until the link from the email is opened, so no account exists for an address nobody
confirmed. The link lasts 24 hours and works once. The page behind it confirms from the
browser, so a mail scanner that only downloads links confirms nothing. The email asks anyone
who didn't sign up not to open the link, since opening it confirms the account with the
password of whoever signed up. The sign up form answers the same way whether or not the address already has an account,
and everything that depends on it runs after the answer is sent, so neither the reply nor its
timing tells. The owner of an address that already has an account gets an email saying so. The
form always asks for the ALTCHA and takes at most 5 sign ups an hour for one address and 20 from
one network address, so it can't be used to flood an inbox. Links in emails are built from
`APP_URL`, never from the Host header of the request. Citizen emails are encrypted like the rest
of citizen data, and the database looks them up by a keyed hash of the address. Citizen sessions
end after a week without activity or 30 days in total, and neither they nor the audit log keep
the citizen's network address or browser.

A password reset works the same way. The form always asks for the ALTCHA, answers the same
whether or not the address has an account, looks the account up only after the answer is sent,
and takes at most 3 requests an hour for one address. The database keeps only a SHA-256 of the
256 bit token, a new request replaces the older link, and using the link deletes it together with
every session of the account in one transaction. The page with the token in its address sends no
Referer header, and guessing tokens is throttled like the other links.

The browser shrinks each photo to at most 2048 px before sending it, so its GPS position and
the rest of its EXIF data never leave the phone. The server still cleans whatever arrives. The
public report form refuses uploads over 10 MB before reading them and takes at most 20 reports
an hour from one address.

The public map at `/harta` shows every report that wasn't rejected, with its category, status
and date, at the point rounded to about 100 m. Photos and descriptions stay with the city hall,
unless `PUBLIC_DETAILS=true`, which the beta has on for now: then anyone sees them on the map
and in the duplicate check, faces and plates included, since nothing blurs or reviews them yet.

## Row-level security

`reports`, `report_photos`, `citizen_users`, `citizen_signups` and `citizen_sessions` hold
personal data, but only the first two have an owner per row that the app's features actually
query by (a citizen viewing their own reports). The other three are looked up by a secret
token or a hashed email during login and sign up, before any identity is established, so
there is no "current citizen" yet to scope a policy by — adding one there would either do
nothing or break that bootstrapping, so they are left to the encryption and short-lived,
hashed tokens already protecting them.

For `reports` and `report_photos`, every ordinary query now runs as `app_data`, a Postgres
role with no more than `SELECT`, `INSERT` and (for `reports`) `UPDATE`, and row-level
security policies on both tables — not the owner role used for migrations and the auth code
that has to look accounts up before it knows who is asking. A citizen can see their own
reports and photos; anyone can see a report and its photo, unless it was rejected, in which
case only staff and the citizen who filed it still can; a citizen can only create a report
under their own id or anonymously, never someone else's. Before this, all of that was checked
only in application code, most visibly in the media route, which used to work out by hand
exactly what this PR now makes the database itself refuse. `withAccess` (`lib/db-access.ts`)
sets who is asking — `app.citizen_id`, `app.is_staff`, `app.public_details` — as session-local
facts scoped to one transaction, so they never leak onto another request sharing a pooled
connection. `APP_DB_PASSWORD` is `app_data`'s login password, shared across the team the same
way as the other secrets; the role and its policies are created by `db/init.sql` and
`scripts/migrate.ts`, but only `scripts/migrate.ts` can set the password, since it alone reads
`.env`.

`report_events` works the same way: staff read and add lines, a citizen reads the lines of their
own reports, and nobody else sees any. `app_data` can't update or delete a line, and a trigger
refuses edits even from the owner role, so the history can't be quietly rewritten. Messages are
encrypted like descriptions, and the audit log only records that a message was written.

Virus scanning comes in later work.

## Deployment

The beta runs on Vercel at https://aici-seven.vercel.app, in the Frankfurt region next to the
Neon database (see `vercel.json`). It is deployed from a local folder with the Vercel CLI, not
from GitHub, because `main` doesn't have the logins yet:

   npx vercel@59.11.7 deploy --prod

The settings live in the Vercel project as secrets: the same `DATABASE_URL` and keys as in
`.env`, the SMTP settings, and `APP_URL=https://aici-seven.vercel.app`. `.vercelignore` keeps
`.env`, `data/` and `research/` out of the upload. Vercel takes requests of at most 4.5 MB,
which is why the browser shrinks photos before sending them.

This includes `APP_DB_PASSWORD`, since row-level security (see Security notes) means the app
can't read or write a report at all without it. It must be set on Vercel, and `npm run
db:migrate` must have been run against the production database at least once, before the
first deploy after this change — otherwise every page that touches a report breaks.
