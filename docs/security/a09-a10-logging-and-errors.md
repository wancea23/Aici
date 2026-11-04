# A09 Security Logging and Alerting Failures and A10 Mishandling of Exceptional Conditions

Researched and written by Sergiu Catanoi.

## A09:2025 Security Logging and Alerting Failures

**What it is.** Attacks go unnoticed because nothing records them, the records can be changed by
whoever did it, nobody looks at them, or nothing raises an alarm when something unusual happens.
The 2025 edition puts "alerting" in the name on purpose: a log nobody is told about doesn't stop
anyone. The opposite mistake belongs here too, logging passwords, tokens or personal data.

**How it could hurt Aici.** Staff actions have legal weight: a status change or an answer to a
citizen is the city hall speaking. If a staff account is taken over, or a staff member closes
reports without doing anything, the only way to show it is a trail of who did what and when. And
because the app holds personal data, the logs must not become a second copy of it.

**What Aici does.**
- Every security relevant staff action is written to `staff_audit_log` (`src/server/security/audit.ts`):
  sign in (success and failure), sign out, password changes and resets, invitations and accepted
  invitations, admin changes to staff accounts, and every report status change or note. Each
  entry has the actor, the action, the target, the result, the IP, the browser and the time.
- The log is append only. Database triggers refuse `update`, `delete` and `truncate` on it, even
  for the app.
- Citizen account events (sign up, email confirmed, sign in, reset requested and done, data
  export, account deletion) go into the same log, on purpose without the IP or the browser: the
  log is never cleared, and nothing there needs them.
- Logs never contain passwords, tokens or decrypted data. Tokens are stored and compared as
  hashes, and emails appear only encrypted or as a keyed hash.
- Rate limits record every attempt, so a brute force run shows up as a pile of blocked
  attempts instead of nothing.

**What is still open.** Nobody is alerted. Failed staff logins are recorded but no one gets an
email when there are fifty of them in ten minutes. The plan is a Vercel log drain or a scheduled
query that emails the admins on spikes of failed logins or rate limit blocks. The audit log also
has no retention period yet; the privacy policy leaves it to be filled in.

## A10:2025 Mishandling of Exceptional Conditions

**What it is.** New in 2025. The program meets a situation it didn't plan for (a timeout, a full
disk, a database that refuses the connection, malformed input deep inside a library) and handles
it badly: it crashes, it skips a check and carries on (fails open), it leaves things half done, or
it shows the user an error message full of internal details.

**How it could hurt Aici.** On 15 September the database password for `app_data` was missing in
production and every page that read reports failed. An error like that can say a lot: the
database host, the role name, the query text, sometimes the parameters. Shown to a visitor, that
is a free map of the system. Handled silently, it looks like the app just doesn't work, and a
user has nothing to report.

**What Aici does.**
- Failures close, they don't open. A session that can't be found, has the wrong shape or has
  expired means "not signed in", never "probably fine". A photo that can't be decrypted, or no
  longer matches its fingerprint, is not served.
- A report and its photo are saved in one transaction, so a failure halfway leaves nothing behind.
- One row that can't be decrypted shows up empty instead of taking down the whole panel.
- Expected problems get expected answers: wrong input is a 400 with a short Romanian message,
  too many attempts a 429 with `Retry-After`, a missing report a 404.
- Pages under the citizen side have an error screen that says something went wrong without
  showing why.

**Gap found and fixed.** For the unexpected ones there was no rule. A route that threw got
Next.js' default answer, an empty 500 with nothing the interface could show, and the error object
went to the log as it was. postgres.js errors carry the query and its parameters, which can
include encrypted personal data. Now every API route is wrapped in one handler,
`safeRoute` in `src/server/http/safe-route.ts`, with the answer and the log line built in
`src/server/http/incident.ts`:
- the user gets a 500 with "A apărut o eroare pe server. Încearcă din nou. Cod: 1a2b3c4d" and
  nothing else;
- the server log gets the same code, the method and path, the error name, code and message and a
  few stack lines, but never the error object with its parameters;
- `redirect()` and `notFound()`, which Next.js implements by throwing, still pass through.

The code lets a person who saw the error and the person reading the log talk about the same
event, without the user ever seeing the internals. `tests/security/incident.test.ts` checks the
answer and the log line.

**What is still open.** The audit write is designed to never block the action it records: if the
log insert fails, the action still happens and the failure is printed. That keeps the service up
when the log table has a problem, at the cost of a gap in the trail. Alerting on that message
would close it.

## Requirements

**SR-09. Security events are logged and the log can't be edited.**
Protects the accountability of staff and the ability to investigate. Every sign in attempt,
account change and report status change is recorded with actor, IP, browser and time in an append
only table, and no log ever contains a password, a token or decrypted personal data.
Checked by: a failed staff login appearing in `staff_audit_log`, and `delete from staff_audit_log`
being refused by the trigger.
Status: partly done. Alerts planned.

**SR-10. Failures stay closed and tell the user nothing internal.**
Protects against leaking internals and against half finished actions. Every API route answers an
unexpected error with a generic message and an incident code, the details go only to the server
log without query parameters, security checks that fail deny access, and multi step writes run in
one transaction.
Checked by: `tests/security/incident.test.ts`, and running the app against a test database with
a wrong password: the API answers with a code, the log has the same code.
Status: done.
