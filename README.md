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

3. Add the secrets from `.env.example` to your `.env`. `STAFF_PASSWORD_PEPPER` and
   `DATA_ENCRYPTION_KEY` must be the same for everyone on the team, because the database is
   shared, so ask a teammate for them. With a different data key the photos and descriptions
   can't be read. The email settings can stay empty while you develop, see Citizen accounts.

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

The browser shrinks each photo to at most 2048 px before sending it, so its GPS position and
the rest of its EXIF data never leave the phone. The server still cleans whatever arrives. The
public report form refuses uploads over 10 MB before reading them and takes at most 20 reports
an hour from one address.

The public map at `/harta` shows every report that wasn't rejected, with its category, status
and date, at the point rounded to about 100 m. Photos and descriptions stay with the city hall,
unless `PUBLIC_DETAILS=true`, which the beta has on for now: then anyone sees them on the map
and in the duplicate check, faces and plates included, since nothing blurs or reviews them yet.

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
