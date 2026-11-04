# Security requirements and the OWASP Top 10

This folder is our analysis for Task 1 of Development of Secure Applications: the OWASP Top 10
(2025 edition) read against Aici, and the security requirements that follow from it. The ten
categories are split between the five of us, two each. Whoever researched a category also wrote
the requirements that come out of it and committed the code change that closes the gap they found.

## What Aici handles

Aici takes a photo, a location and a short description of an urban problem from a citizen and
puts it in front of the city hall. There are no payments, but almost everything it stores is
personal data in the sense of Legea 195/2024 (the Moldovan law aligned with the GDPR).

| Data | Where it comes from | Why it matters |
| --- | --- | --- |
| Photo of the problem | Upload from the phone | Can show faces, car plates, the inside of a yard. The original file carries EXIF with GPS and the phone model. |
| Exact location | GPS or a pin on the map | Often the street where the citizen lives. |
| Description | Free text | Can contain names, phone numbers, insults. |
| Citizen account | Sign up with email and password | Ties reports to a real person. |
| Staff account | Invitation from an admin | Can change any report and answer in the city hall's name. |
| Sessions and one time links | Cookies and emails | Whoever holds one is signed in as that person. |
| IP address and browser | Every request | Used for rate limits and the staff audit log. |
| Report history and staff notes | The panel | The city hall's official answer, with a 30 day legal deadline. |

The people we design for: anonymous visitors (the public map, anonymous reports), signed in
citizens (their own reports), staff (triage and answers). The people we defend against: bots
flooding the form, someone uploading a hostile file, someone trying to take over a staff account,
someone reading the database or a backup, and a curious insider.

## Parts

| OWASP Top 10:2025 | Part | Researched by |
| --- | --- | --- |
| A01 Broken Access Control, A05 Injection | [a01-a05-access-and-injection.md](a01-a05-access-and-injection.md) | Andrei Eftode |
| A02 Security Misconfiguration, A03 Software Supply Chain Failures | [a02-a03-configuration-and-supply-chain.md](a02-a03-configuration-and-supply-chain.md) | Nicolae Turcanu |
| A04 Cryptographic Failures, A07 Authentication Failures | [a04-a07-cryptography-and-authentication.md](a04-a07-cryptography-and-authentication.md) | Ion Moroșanu |
| A06 Insecure Design, A08 Software or Data Integrity Failures | [a06-a08-design-and-integrity.md](a06-a08-design-and-integrity.md) | Rodion Bulimar |
| A09 Security Logging and Alerting Failures, A10 Mishandling of Exceptional Conditions | [a09-a10-logging-and-errors.md](a09-a10-logging-and-errors.md) | Sergiu Catanoi |

## Security requirements

The full text of each requirement, with how we check it, is in the part it belongs to.

| ID | Requirement | OWASP | Owner | Status |
| --- | --- | --- | --- | --- |
| SR-01 | Passwords and sessions resist guessing and theft | A07 | Ion | Done |
| SR-02 | Personal data is encrypted at rest and in transit | A04 | Ion | Done |
| SR-03 | Access is denied by default and enforced by the database | A01 | Andrei | Done |
| SR-04 | Input is validated at the boundary and never becomes code | A05 | Andrei | Done |
| SR-05 | Every upload is treated as hostile | A06 | Rodion | Done |
| SR-06 | A photo can be proven unchanged since it arrived | A08 | Rodion | Done |
| SR-07 | Production runs with a hardened configuration and no secrets in the code | A02 | Nicolae | Partly, CSP planned |
| SR-08 | Dependencies are pinned, audited on every push and kept current | A03 | Nicolae | Done |
| SR-09 | Security events are logged and the log can't be edited | A09 | Sergiu | Partly, alerts planned |
| SR-10 | Failures stay closed and tell the user nothing internal | A10 | Sergiu | Done |

## What changed in the code with this analysis

Each of us found one gap while doing the research and closed it:

- Ion: a citizen session now ends after one hour without activity, as the privacy policy already
  promised. It used to last a week.
- Andrei: anonymous reads run as a separate database role, `app_public`, that can't read who
  reported something or the exact location. A new report can no longer be inserted with a status
  other than `nou` or straight into a group.
- Rodion: every photo gets a SHA-256 fingerprint and the server time when it arrives. The
  fingerprint is checked again before every download and shown to staff.
- Nicolae: Next.js went from 16.3.5 to 16.4.5, which closes two unauthenticated remote code
  execution advisories, and sharp got its libvips fix. Every push now runs lint, type check,
  tests and `npm audit` on GitHub, and Dependabot opens update pull requests every week.
- Sergiu: every API route goes through one error handler. An unexpected error gives the user a
  short message with an incident code, and only the server log gets the details.

After pulling these changes, run `npm run db:migrate` once against the database (it adds the
`app_public` role, the new insert rule and the photo fingerprint column), then `npm ci`.
