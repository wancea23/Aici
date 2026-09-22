# Screens

Which design mockup belongs to which page file, and what data that page already has.

The mockup folder names and this app's route names **don't match** — `my_account_citizen`
is the file `src/app/(citizen)/profile/page.tsx`. This table is how you find your way between
the two.

Mockups live in [`design/stitch/`](design/stitch/); read
[`design/README.md`](design/README.md) first (it covers variants, the design tokens, and which
parts of the mockups show data the app doesn't actually have).

## Status column

- **restyled** — already rebuilt against the new design system. Use it as the reference for how
  the tokens are meant to be applied.
- **needs restyle** — works and has its data, but still on the old pre-redesign styling. This
  is where the remaining UI work is.
- **stub** — page exists so the link doesn't 404, but it's essentially empty.

## Citizen screens

| Route | File | Status | Mockup folder | Data it already has |
| --- | --- | --- | --- | --- |
| `/` | `src/app/(citizen)/page.tsx` | restyled | `home_report_a_problem` | `currentCitizen()` → the signed-in citizen or `null` (the form works either way). The form itself is `features/reports/ReportForm.tsx` and handles photo, map pin, category, description, ALTCHA, submit |
| `/map` | `src/app/(citizen)/map/page.tsx` | needs restyle | `public_map` | `listPublicReports()` → `{ id, category, status, lat, lng, created_at, count, description? }[]`. Coordinates are **already rounded to ~100 m** and rejected reports are already excluded. `count` is how many duplicate reports that one pin stands for |
| `/sign-in` | `src/app/(citizen)/sign-in/page.tsx` | restyled | `citizen_sign_in` | No server data. Posts to `/api/citizen/login` |
| `/sign-up` | `src/app/(citizen)/sign-up/page.tsx` | restyled | `create_account` (+ 3 competing variants — see README) | No server data. Posts to `/api/citizen/register`. Live password checklist is `features/citizens/PasswordChecklist.tsx` |
| `/forgot-password` | `src/app/(citizen)/forgot-password/page.tsx` | restyled | `forgot_password` | `RESET_MINUTES` (how long the emailed link lasts) |
| `/new-password?token=` | `src/app/(citizen)/new-password/page.tsx` | restyled | *none* | The reset token is validated server-side; page gets the account's email, or renders an "expired link" state |
| `/verify-email?token=` | `src/app/(citizen)/verify-email/page.tsx` | restyled | `confirm_email_verified` | Signup token → the email being confirmed, or an "expired link" state |
| `/profile` | `src/app/(citizen)/profile/page.tsx` | needs restyle | `my_account_citizen` (+ 3 competing variants — see README) | `currentCitizen()` → `{ id, email }`, and `listReportsForCitizen(id)` → `{ id, category, description, status, created_at, events[] }[]`. `events[]` is the citizen-facing timeline (status changes + messages from city hall). Deadline per report: `answerDeadline()` in `features/reports/deadline.ts` |
| `/privacy` | `src/app/(citizen)/privacy/page.tsx` | **stub** | *none* | Static page, no data. Has placeholder text summarising what the app actually does with photos and location; needs a real policy written — ask Andrei. **Not linked from anywhere yet** (there's no footer) |

## Staff screens

All staff routes are gated by `requireStaffPage()`, which re-checks the session against the
database on every request. `/admin` additionally requires `{ role: "admin" }` — an operator
hitting it gets a 404, not a redirect.

| Route | File | Status | Mockup folder | Data it already has |
| --- | --- | --- | --- | --- |
| `/login` | `src/app/(staff)/login/page.tsx` | needs restyle | *none* | No server data. Posts to `/api/auth/login`. Reuses the same `LoginForm` as citizens, pointed at the staff endpoint |
| `/dashboard` | `src/app/(staff)/dashboard/page.tsx` | needs restyle | `staff_dashboard` | `listReports()` → full reports including exact `lat`/`lng`, `members[]` (ids of duplicates grouped under it) and `events[]` with staff author names. The map + feed + status form are all in `features/reports/ReportsBoard.tsx` / `ReportDetails.tsx` |
| `/admin` | `src/app/(staff)/admin/page.tsx` | needs restyle | `staff_administration_audit_log` | `listStaff()` → `{ id, email, role, isActive, forceReset, createdAt, lastLogin }[]`, and `listAudit(100)` → `{ id, createdAt, actor, action, target, status, ip, details }[]`. Invite form + per-row actions are in `features/staff/StaffAdmin.tsx` |
| `/account` | `src/app/(staff)/account/page.tsx` | needs restyle | *none* | The signed-in staff user: `{ email, role }` |
| `/account/password` | `src/app/(staff)/account/password/page.tsx` | needs restyle | *none* | The signed-in staff user; also serves the forced-reset flow |
| `/invite?token=` | `src/app/(staff)/invite/page.tsx` | needs restyle | *none* | Invite token → invited email + role, or an "expired invitation" state |
| `/reset-password?token=` | `src/app/(staff)/reset-password/page.tsx` | needs restyle | *none* | Reset token → the account's email, or an "expired link" state |
| `/reports` | `src/app/(staff)/reports/page.tsx` | **stub** | *none* | Staff-gated but empty. Intended as exports/statistics — nothing is defined yet, ask Andrei. **Deliberately not added to the staff nav** until there's something on it |

## Mockups with no matching route

`aici_civic_emblem`, `authentic_documentary_close_up_photograph_of_a_damaged_asphalt_street_with_an`,
and `civic_pulse_chisinau` aren't screens — see `design/README.md`.

## Routes named differently in the mockups

The mockups' internal `data-path` navigation uses names that were never adopted. If you see
these referenced inside a `code.html`, they mean:

| Name in mockups | Actual route |
| --- | --- |
| `report-problem`, `new-report` | `/` |
| `explore-map`, `citizen-feed` | `/map` |
| `create-account` | `/sign-up` |
| `my-activity` | `/profile` |
| `citizen-profile` | `/profile` (no separate settings page exists) |
| `staff-sign-in` | `/login` |
| `staff/dashboard` | `/dashboard` |
| `staff/administration` | `/admin` |
