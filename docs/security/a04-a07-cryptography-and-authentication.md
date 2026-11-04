# A04 Cryptographic Failures and A07 Authentication Failures

Researched and written by Ion Moroșanu.

## A04:2025 Cryptographic Failures

**What it is.** Data that should be secret is not protected well enough, at rest or in transit:
no encryption, an old algorithm (MD5, SHA-1, DES), a mode without integrity, a key kept next to
the data or in the code, predictable random numbers, or plain HTTP somewhere along the way. The
damage shows up later, when a backup, a dump or a log ends up in the wrong hands.

**How it could hurt Aici.** The database knows where a citizen stood when they took the photo,
which is often their own street, plus their email and whatever they typed. A leaked Neon backup
or a single SQL injection would turn the map of complaints into a map of complainers.

**What Aici does.**
- Description, exact location, photo and citizen email are encrypted by the app with
  AES-256-GCM before they reach the database (`src/server/security/crypto.ts`). Each value gets a
  fresh 12 byte IV, and the report id plus the field name go in as associated data, so a value
  copied into another row or column no longer decrypts.
- The key lives only in Infisical (EU region) and in Vercel's environment. It never goes into the
  database or the repository.
- An encrypted email can't be searched, so each one also has an HMAC-SHA256 index with a key
  derived through HKDF. Logging in looks up the index, never the plain address.
- The `geom` column keeps the point rounded to about 100 m. Map queries and the duplicate check
  never need the exact one.
- Session tokens and one time links are 256 random bits from `crypto.randomBytes`, and only their
  SHA-256 is stored, so a stolen sessions table can't be replayed.
- Transport: HTTPS everywhere with HSTS for two years, and TLS on the connection to Postgres.

**What is still open.** There is no procedure to rotate `DATA_ENCRYPTION_KEY`. The values carry a
version prefix (`enc:v1:`), so a second key can be added later and rows re-encrypted in the
background, but that is not built yet.

## A07:2025 Authentication Failures

**What it is.** The app can't reliably tell who it is talking to: weak or reused passwords are
accepted, logins can be guessed without limit, sessions never expire or survive a password
change, or error messages reveal which accounts exist.

**How it could hurt Aici.** A staff account can mark any report as solved and write official
answers in the city hall's name, so it is the account worth stealing. On the citizen side, an
account shows the history of everything that person reported, with exact locations.

**What Aici does.**
- Passwords are hashed with Argon2id (19 MiB, two passes, one lane, the OWASP minimum) with a
  pepper kept outside the database (`src/server/security/password.ts`). Old hashes are upgraded
  on the next login if the parameters change.
- Staff passwords need at least 15 characters. Citizen passwords follow a visible checklist. Every
  new password is checked against Have I Been Pwned with k-anonymity: only the first five hex
  characters of its SHA-1 leave the server.
- Logins are throttled per IP and per account, with a growing delay after five failures and an
  ALTCHA proof of work challenge after ten (`src/server/security/rate-limit.ts`). A wrong email and
  a wrong password get the same answer, and "forgot password" always says the same thing.
- Sessions live in the database, not in the cookie. Cookies are `HttpOnly`, `Secure`,
  `SameSite=Lax` and use the `__Host-` prefix in production. Staff sessions end after 30 minutes
  idle or 12 hours in total. A password change or reset ends every session of that account.
- Password reset links are valid for 15 minutes, work once, and a new request cancels the old one.

**Gap found and fixed.** The privacy policy (`docs/PRIVACY.md`) tells citizens their session ends
after one hour without activity. The code let it run for a week. The limits now live in
`src/features/citizens/session-policy.ts` (one hour idle, 30 days total, idle timer moved forward
at most every 5 minutes), a test checks them against the policy text, and `db/migrate.ts` cuts the
sessions that were opened under the old rule.

**What is still open.** A second login factor for staff. It was built in September and taken out
again. It should come back before a real city hall uses the panel.

## Requirements

**SR-01. Passwords and sessions resist guessing and theft.**
Protects staff and citizen accounts. Passwords are stored only as peppered Argon2id hashes, new
passwords are checked against known breaches, login attempts are limited per IP and per account,
and sessions are server side, expire on their own (staff 30 minutes idle, citizens one hour idle)
and end everywhere when the password changes.
Checked by: `tests/security/auth.test.ts`, `tests/citizens/session-policy.test.ts`, the cookie
flags in the browser's developer tools, and repeated wrong logins hitting the 429 answer.
Status: done. Staff second factor planned.

**SR-02. Personal data is encrypted at rest and in transit.**
Protects the photo, exact location, description and email. They are encrypted with AES-256-GCM
bound to their row before storage, the key is kept only in the secrets manager, emails are found
through a keyed hash, and every connection uses TLS.
Checked by: `tests/security/crypto.test.ts` (a value moved to another row fails to decrypt) and a
look at the raw table, where those columns read as `enc:v1:...`.
Status: done. Key rotation planned.
