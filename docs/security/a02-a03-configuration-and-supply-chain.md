# A02 Security Misconfiguration and A03 Software Supply Chain Failures

Researched and written by Nicolae Turcanu.

## A02:2025 Security Misconfiguration

**What it is.** The code may be fine, but the way it is deployed is not: default passwords, debug
pages and stack traces in production, missing security headers, cloud storage left public,
features turned on that nobody uses, secrets in the repository. It moved up to second place in
2025 because almost every app now depends on cloud settings that are easy to get wrong.

**How it could hurt Aici.** The app runs on Vercel with a Neon database, a mail account and a
secrets manager, all configured by hand by different people. One example already happened: in
September a new database password was added under Vercel's shared variables instead of the
project, production sent an empty password and the public map was down for a few hours.

**What Aici does.**
- Every response carries security headers (`next.config.mjs`): `Strict-Transport-Security` for two
  years, `X-Frame-Options: DENY` against clickjacking, `X-Content-Type-Options: nosniff`, a strict
  `Referrer-Policy`, and a `Permissions-Policy` that allows the camera and location only for our
  own origin and turns the microphone off.
- No secret is in the repository. All of them live in Infisical (EU region) and are synced to
  Vercel automatically, so there is one place to change a value. `.env.example` lists the names
  only.
- The app never connects to the database as the owner for normal requests. It uses `app_data`
  (row level security applies to it) and `app_public` for anonymous reads.
- Production is a Next.js build: no stack traces in answers, no development endpoints.
- Cookies for sessions use the `__Host-` prefix in production, so they can't be set by a
  subdomain or sent over plain HTTP.

**What is still open.** There is no Content Security Policy yet. It needs a nonce per request,
because MapLibre starts a web worker and the ALTCHA widget runs its own script, so it was kept for
a separate change instead of rushing it. A new team member also still sets up their local `.env`
by hand; `infisical export` would remove that step.

## A03:2025 Software Supply Chain Failures

**What it is.** New in 2025, it widens the old "vulnerable and outdated components" category to
everything we build on: packages with known vulnerabilities, packages taken over by an attacker,
typosquatted names, an unprotected build pipeline, a lockfile that doesn't match what gets
installed. Most of the code that runs in Aici was not written by us.

**How it could hurt Aici.** Aici has 16 direct production dependencies, which pull in about 140
packages in total. The riskiest ones are exactly those that touch hostile input: sharp and libvips
parse every uploaded photo before we know what it is, and Next.js parses every request.

**What we found.** Running `npm audit --omit=dev` on main on 4 November 2026 gave 1 critical and 4
high advisories in production dependencies:

| Package | Version | Problem | Fix |
| --- | --- | --- | --- |
| next | 16.3.5 | Critical. 11 advisories, two of them unauthenticated remote code execution (image optimization with SVG, `use cache` returning typed arrays), plus request forgery and cache poisoning | 16.4.5, same major |
| sharp | 0.35.4 | High. libvips' librsvg dependency, reached while parsing uploads | 0.35.5 |
| source-map-js | 1.2.1 | High. Denial of service, indirect through postcss | 1.2.2 |
| nodemailer | 9.1.1 | High. Several parser denial of service bugs | 10.x, a major version |
| zod | 3.23.8 | High. Memory exhaustion on oversized collections | 4.x, a major version |

**Gap found and fixed.** Nobody was checking this automatically, so a critical advisory could sit
in production for weeks. This change:
- moves next and eslint-config-next to 16.4.5 and sharp to 0.35.5, and updates source-map-js
  through the lockfile. The critical advisory and three of the highs are gone.
- adds a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on every push and pull
  request: `npm ci` (fails if the lockfile and `package.json` disagree), lint, type check, the
  tests, and `npm audit --omit=dev --audit-level=critical`. The job has read only permissions and
  the actions are pinned to a commit hash, not a tag.
- adds Dependabot (`.github/dependabot.yml`), which opens a pull request every week for npm
  packages (small updates grouped, major ones separately) and for the workflow's actions.

**What is still open.** nodemailer 10 and zod 4 are major versions with changes in their APIs, so
they get their own pull requests and a test pass each. Until then the audit gate is set to
critical; it goes to high once those two are done. Dependabot security alerts also have to be
turned on in the repository settings by the owner.

## Requirements

**SR-07. Production runs with a hardened configuration and no secrets in the code.**
Protects the whole deployment. Every response carries the security headers listed above, secrets
exist only in the secrets manager and the hosting environment, the app connects with the least
privileged database role that works, and production shows no debug output.
Checked by: `curl -I https://aici-seven.vercel.app` shows the headers, a search of the repository
and its history finds no keys, and an error page in production shows no stack trace.
Status: partly done. CSP planned.

**SR-08. Dependencies are pinned, audited on every push and kept current.**
Protects against known vulnerabilities in code we did not write. Versions are exact and locked,
CI installs only from the lockfile and fails on a critical advisory, Dependabot proposes updates
every week, and a critical advisory in production is patched within seven days.
Checked by: the CI run on every pull request on GitHub, and `npm audit --omit=dev` locally.
Status: done.
