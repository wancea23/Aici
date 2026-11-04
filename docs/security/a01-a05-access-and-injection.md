# A01 Broken Access Control and A05 Injection

Researched and written by Andrei Eftode.

## A01:2025 Broken Access Control

**What it is.** Users can act outside what they are allowed to do: read another user's records by
changing an id in the URL (IDOR), call an admin endpoint without being an admin, edit something
they should only see, or reach data because a check exists in the interface but not on the
server. The 2025 edition also folds server side request forgery into this category. It has been
the most common problem in the list since 2021.

**How it could hurt Aici.** Three kinds of people use the same data. The public may see an open
report on the map but not who sent it. A citizen may see their own reports, rejected ones
included, but nobody else's. Staff may change any report. One missing check in one query and a
visitor gets the reporter's id or exact location, or a citizen marks their own report as solved.

**What Aici does.**
- The proxy only checks that a session cookie exists, to send visitors to the login page quickly.
  The real check runs again on every staff page and API route against the session in the
  database (`src/features/staff/dal.ts`).
- Report ids are random UUIDs, checked for shape before any query.
- Row level security in Postgres decides what each identity can see. The app's report and photo
  queries run as the role `app_data`, which is not the table owner, so the policies actually apply
  to it. `withAccess()` in `src/server/db/access.ts` sets who is asking for one transaction only:
  `app.citizen_id`, `app.is_staff`, `app.public_details`. Rejected reports never reach the public,
  photos only reach the reporter and staff (or the public while `PUBLIC_DETAILS` is on).
- The app does not fetch URLs supplied by users, so there is no request forgery path. The only
  outgoing calls go to fixed hosts (Have I Been Pwned, the mail server).

**Gaps found and fixed.**
1. Policies work on rows, not columns. For an open report, the anonymous identity could read
   every column, `citizen_id` and the encrypted exact location included. Nothing used them, but
   one careless `select *` in a public query would have exposed them. Anonymous reads (the public
   map and the duplicate check) now switch to a role `app_public` with `set local role`. It can
   select seven columns of `reports` and nothing else, so asking it for the reporter fails with
   "permission denied".
2. The insert policy checked who the reporter was, but not the status or the group. A request
   that reached the database with `status = 'rezolvat'` or a `duplicate_of` would have been saved.
   The policy now also requires `status = 'nou'` and `duplicate_of is null`. Only staff move a
   report from there.

Both were checked on a throwaway Neon branch: 14 checks, among them that `app_public` can't read
`citizen_id` or `location` and can't write, that forged inserts are refused, and that staff and
citizen queries work as before.

**What is still open.** `set_config` and `set role` can be called by `app_data` itself, so these
policies stop mistakes in the app's own queries, not an attacker who can already run SQL. That
is what the injection defenses below are for.

## A05:2025 Injection

**What it is.** Untrusted input ends up interpreted as code: SQL built by joining strings,
HTML that runs as script (cross site scripting), shell commands, template expressions. The fix is
always the same idea: keep data and code apart, and validate input before it gets anywhere.

**How it could hurt Aici.** Every report carries free text from an anonymous person, and that text
is shown on the public map and in the staff panel. A description like
`<img src=x onerror=...>` would run in the browser of every staff member who opens it. On the
database side, one string concatenated into a query would bypass every access rule above.

**What Aici does.**
- All SQL goes through postgres.js tagged templates. Values are sent as parameters, never pasted
  into the query text. The only exception is setting the `app_data` password in
  `db/migrate.ts`, where Postgres accepts no parameter, so `quote_literal` builds it.
- Every API route validates its input with a zod schema first: types, lengths, allowed categories
  and statuses, coordinates inside Moldova (`src/features/reports/validation.ts`). Anything that
  doesn't fit gets a 400 before it touches the database.
- User text reaches the page as text. React escapes it, and the map popups are built with
  `textContent`, never `innerHTML`. We tested it with an `<img onerror>` description: it shows
  as plain text.
- Photos are decoded and re encoded on the server, so a file that is really a script or an SVG
  never reaches a browser as is (details in the A06 part).

**What is still open.** A Content Security Policy would make the browser refuse inline scripts
even if one slipped through. It is planned, see the A02 part.

## Requirements

**SR-03. Access is denied by default and enforced by the database.**
Protects reporters' identities, exact locations and the integrity of report statuses. Every report
and photo query runs under row level security as a role that is not the owner, anonymous reads
run as `app_public` that can only read public columns, staff rights are checked against the
database on every request, and a new report always starts as `nou` outside any group.
Checked by: the 14 checks on a Neon branch described above, and a staff URL opened without a
session redirecting to the login page.
Status: done.

**SR-04. Input is validated at the boundary and never becomes code.**
Protects the database and every browser that shows a report. All input passes a zod schema before
use, all SQL is parameterized, and user text is always rendered as text.
Checked by: `tests/reports/location.test.ts` (coordinates outside Moldova refused), a description
with an HTML payload shown as text on the map, and a code search showing no SQL built from
strings.
Status: done. CSP planned.
