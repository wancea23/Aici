# A06 Insecure Design and A08 Software or Data Integrity Failures

Researched and written by Rodion Bulimar.

## A06:2025 Insecure Design

**What it is.** The weakness is in the plan, not in a line of code: a flow that was never thought
through from the attacker's side, a missing limit on something cheap to abuse, trust placed in
the client. A perfect implementation of an insecure design is still insecure, so this is fixed
with threat modeling and secure patterns before coding, not with patches after.

**How it could hurt Aici.** The whole service is a form that accepts a file from anyone on the
internet, without an account. Thought through from the attacker's side, that form is the main
attack surface: a 2 GB upload to fill the memory, a script renamed to `.jpg`, an image built to
crash the decoder, a thousand fake reports to bury the real ones, or a perfectly normal photo
whose metadata gives away the citizen's home coordinates and phone model.

**What Aici does.** Upload handling was designed as a pipeline where each step assumes the
previous one failed:
1. The size is checked from `Content-Length` in the proxy and again in the route, before the body
   is read. The limit is 10 MB, and the browser shrinks photos before sending them.
2. Each IP can send 20 reports an hour (`src/server/security/rate-limit.ts`).
3. The first bytes must be a real JPEG, PNG or WebP signature (`looksLikeImage` in
   `src/features/photos/image.ts`). The file name and the declared type are ignored.
4. sharp decodes the whole image with `failOn: "error"`, rotates it, scales it to at most 1600 px
   and writes a brand new WebP. Only pixels survive, so EXIF, GPS, the phone model and anything
   appended to the file are gone.
5. Faces and car plates are blurred on the server before the photo is stored. The original is
   never kept.
6. Only then is the photo encrypted and saved, in the same transaction as the report, so there is
   never a report without its photo or a photo without its report.

Around the pipeline: a report gets a public point rounded to about 100 m, the duplicate check
only compares against what the public map already shows, and staff answers follow the legal
30 day deadline, which is visible on every report in the panel.

**What is still open.** Abuse detection beyond rate limits (for example many reports from many
IPs at one spot) and a moderation step before a photo goes public.

## A08:2025 Software or Data Integrity Failures

**What it is.** Code or data is trusted without checking that it is what it claims to be: updates
without signatures, packages from untrusted sources, a CI pipeline anyone can change, objects
deserialized from user input, or records that can be edited later without a trace.

**How it could hurt Aici.** A report is evidence. A citizen may later complain that the city hall
ignored a dangerous pothole for two months, and the city hall may answer that the photo shows
something else. If a photo or a status history could be changed quietly, by a bug, an insider or
someone with database access, neither side could prove anything.

**What Aici does.**
- AES-GCM is authenticated encryption: a stored photo or text changed by even one bit fails to
  decrypt, and the row id bound as associated data stops a value from being moved to another row.
- The report history (`report_events`) is append only: a database trigger refuses updates. The
  staff audit log refuses updates, deletes and truncation.
- The app never deserializes objects from user input. Request bodies are JSON or form fields, and
  each one passes a zod schema.
- Code reaches production only through GitHub: Vercel deploys main once a pull request is merged,
  and nobody deploys from a laptop.

**Gap found and fixed.** Encryption proves a photo was not damaged, but not which photo the
citizen actually sent and when, in a form someone outside the system can check. Every photo now
gets a SHA-256 fingerprint of the cleaned image when it arrives, stored next to the server time
(`src/features/photos/fingerprint.ts`, column `report_photos.sha256`). The media route recomputes
it before every download and refuses to serve a photo that no longer matches. Downloads carry a
`Repr-Digest` header (RFC 9530) so a saved copy can be checked too, and the staff panel shows the
fingerprint and the time it was received. `db/migrate.ts` fills in fingerprints for older photos.

## Requirements

**SR-05. Every upload is treated as hostile.**
Protects the server and the citizen's privacy. Uploads are limited in size before they are read
and in number per IP, must start with a real image signature, are fully decoded and re encoded so
only pixels survive, and have faces and plates blurred before anything is stored.
Checked by: `tests/photos/face-blur.test.ts`, `tests/photos/plate-blur.test.ts`, uploading a
text file renamed to `.jpg` (refused with 400), and reading the EXIF of a stored photo (empty).
Status: done.

**SR-06. A photo can be proven unchanged since it arrived.**
Protects the evidence value of a report. Each photo carries a SHA-256 of its cleaned image and
the server time it arrived, the fingerprint is verified before every download, a mismatch is never
served, and the report history can only grow.
Checked by: `tests/photos/fingerprint.test.ts`, comparing `sha256sum` of a downloaded photo with
the value in the panel, and changing the stored fingerprint by hand on a test branch (the photo is
then refused with 500).
Status: done.
