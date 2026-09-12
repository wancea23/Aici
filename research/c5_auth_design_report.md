# c5: staff authentication and session design (Next.js, Postgres)

Technical Architecture and Implementation Specification for Staff Authentication and Session Management
Architectural Strategy: Custom Primitives Versus Framework Abstractions

Municipal infrastructure applications managing civic reports require robust identity and access management (IAM) capable of withstanding external scrutiny and regulatory compliance. In designing the staff authentication sub-system for Aici, an engineering tension emerges between adopting high-level, framework-provided authentication solutions and composing verified, lower-level cryptographic primitives. In an academic environment evaluating secure software engineering, this decision directly governs whether security invariants are demonstrable in source code or obscured behind third-party abstractions.   

Comparative Framework Assessment

The contemporary JavaScript and TypeScript ecosystem presents three primary architectural vectors: handwritten modular primitives adhering to the Copenhagen Book, emerging all-in-one solutions such as Better Auth, and legacy ecosystem staples such as Auth.js (NextAuth v5).   

Evaluation Parameter	Handwritten Primitives (Oslo / Copenhagen)	Better Auth	Auth.js (NextAuth v5)
Current Maintenance Status	

Standalone cryptographic primitives maintained independently; Copenhagen Book functions as a vendor-neutral specification.

	

Rapidly evolving independent framework with extensive community adoption across modern JavaScript frameworks.

	

Entered security-patch maintenance status following core maintainer transitions.

CVE and Security History	

Zero framework-level CVEs; posture determined by direct implementation adherence to RFC standards.

	

Rapid patch resolution, but susceptible to design-level logic flaws during feature velocity (e.g., CVE-2026-53516 in account linking).

	

Documented vulnerabilities across routing handlers, callback state management, and token decryption.

Database Pooler Compatibility	

Direct, unimpeded integration with postgres.js; native execution with prepare: false for transaction-mode PgBouncer.

	

Native support via internal ORM adapters; requires explicit configuration to disable prepared statement caching.

	Adapter-based; historically prone to state leakages and connection exhaustion over serverless pooled instances.
Control Transparency	

Absolute; every hash derivation, byte comparison, and cookie parameter is explicitly expressed in application code.

	

Low to Moderate; encapsulates session rotation, cookie serialization, and state validation inside opaque library boundaries.

	

Low; multi-tier architectural wrappers and implicit defaults obscure runtime authorization mechanics.

  
Evaluation and Academic Justification

For a secure software application course where every security control must be defended and demonstrated, handwritten authentication founded upon the Copenhagen Book and standalone primitives (such as @node-rs/argon2, @simplewebauthn, and native node:crypto) is the superior choice. All-in-one frameworks prioritize rapid application scaffolding over mechanical transparency. Better Auth and Auth.js conceal token generation, session lookups, and validation lifecycles within opaque helper functions. In an academic defense, using such abstractions prevents students from demonstrating how session fixation is mitigated at the byte level, how race conditions are handled within transaction pools, or how timing side-channels are neutralized.   

Furthermore, relying on full-featured authentication frameworks introduces severe supply chain surface area and maintainer volatility. Auth.js transitioned to maintenance-only status after multiple breaking redesigns, while Better Auth’s rapid release cadence introduces potential logic regression vectors in edge-case authentication flows. Conversely, implementing direct database-backed sessions and cryptographic verification via modular utilities ensures that the application's attack surface remains minimal, verifiable, and entirely inspectable.   

Password Storage Architecture

Password authentication forms the primary access factor for municipal staff, necessitating rigorous algorithmic tuning, deterministic library execution, and active mitigation of resource-exhaustion vectors.   

Cryptographic Parameter Selection

Staff passwords must be hashed using the Argon2id variant, standardized in RFC 9106, which provides optimal resistance against both side-channel cache-timing attacks (inheriting Argon2i’s data-independent memory transitions) and hardware-accelerated parallel GPU cracking (inheriting Argon2d’s data-dependent memory permutations).   

The OWASP Password Storage Cheat Sheet and RFC 9106 define specific parameter sets reflecting distinct operational trade-offs between memory utilization and iteration counts.   

Specification Standard	Memory Cost (m)	Time Iterations (t)	Parallelism (p)	Operational Suitability
RFC 9106 / OWASP Recommended	47,104 KiB (46 MiB)	1	1	

Standard cloud backends with ample physical RAM.

OWASP Balanced Target	19,456 KiB (19 MiB)	2	1	

Shared virtual machines and memory-managed instances.

RFC 9106 Constrained Target	12,288 KiB (12 MiB)	3	1	

Resource-constrained containers with heavy thread counts.

  

Because Aici operates on a single virtual machine alongside PostgreSQL and Node.js runtimes, the OWASP Balanced configuration (m=19,456 KiB, t=2, p=1) represents the optimal design choice. Allocating 19 MiB per hash creates an insurmountable memory footprint for massive GPU-based cracking clusters while ensuring that concurrent administrative logins do not trigger host kernel out-of-memory (OOM) faults.   

Node.js Library Determinism Across Operating Systems

The application must standardize on @node-rs/argon2 rather than the traditional argon2 npm wrapper. The legacy argon2 package relies on node-gyp, requiring an active host toolchain comprising Python, Make, and C++ compilers (such as Visual C++ Build Tools on Windows workstations or gcc/g++ on Linux environments). This native compilation mechanism frequently breaks across mixed-OS student development setups and containerized build pipelines.

In contrast, @node-rs/argon2 is authored in Rust and compiled via N-API into pre-built native binaries distributed per platform and architecture. This guarantees zero-compilation execution on Windows development laptops and Linux VM hosts alike, while unlocking SIMD-accelerated instruction sets (such as AVX-512 and Neon) for constant-time cryptographic operations without platform divergence.

Application-Level Pepper Mechanics

A cryptographic pepper provides defense-in-depth against offline password recovery if the database is extracted through an unpatched vulnerability or an compromised database backup. A pepper is a high-entropy secret (256 bits) maintained strictly outside the database within the host environment.

Two technical implementations are available for peppering: passing the secret to the native key parameter of Argon2id, or computing an intermediate HMAC-SHA-256 digest of the password prior to Argon2id hashing. Computing HMAC-SHA-256(pepper,password) is the preferred standard. This approach prevents potential denial-of-service vulnerabilities caused by excessively long input strings by reducing passwords of arbitrary length to an exact 32-byte binary digest before they reach the memory-intensive Argon2id hashing pipeline. The pepper must be defined in the secure host environment as STAFF_PASSWORD_PEPPER and verified at runtime startup via strict environment schema validation.

Hashing Cost Denial-of-Service Mitigations

Because password hashing deliberately consumes significant system resources, an unauthenticated client can launch an application-level denial of service by saturating the login route with computationally expensive requests. To bound this vulnerability, the system enforces three consecutive defensive layers:

Strict schema validation using Zod immediately truncates request processing, rejecting passwords under 15 characters or exceeding 128 characters prior to cryptographic execution.   

Atomic sliding-window IP rate limiting in PostgreSQL executes before the hashing pipeline is entered, throttling automated flood attempts.

Cryptographic task dispatching is managed through an in-memory queue limiter (e.g., p-limit) that caps concurrent Argon2id hashing operations to N(vCPU) − 1, guaranteeing that password verification never exhausts host execution resources or starves the primary Node.js event loop.

Password Policy Standards: NIST SP 800-63B-4 Compliance

Identity guidelines underwent major revisions with the finalization of NIST SP 800-63B Revision 4 in 2025, which abandons traditional heuristic complexity rules in favor of empirical credential hygiene.   

Core Policy Mandates

The implementation of password verification in Aici strictly mirrors the specifications set forth in NIST SP 800-63B-4:   

Length Bounds: The verifier must require memorized secrets to be at least 15 characters in length for administrative and staff boundaries, and must support passphrases up to at least 64 characters (with 128 characters recommended). The verifier must not silently truncate passwords upon ingestion.   

Prohibition of Composition Rules: The verifier SHALL NOT require users to include arbitrary combinations of uppercase letters, lowercase letters, numbers, or special symbols. Research indicates that composition rules fail to expand entropy, instead driving predictable substitution patterns (such as capitalizing the first letter and appending an exclamation point) that cracking software actively targets.   

Prohibition of Periodic Arbitrary Rotation: The verifier SHALL NOT enforce mandatory periodic password expiration schedules (such as 60-day or 90-day rotations). Users subjected to calendar rotations inevitably select predictable transformations of their previous passwords. Credential changes must be mandated solely upon explicit evidence of compromise or account administrative revocation.   

Permissible Character Ingestion: The verifier must accept all printable ASCII characters, spaces, and Unicode code points to permit multi-word passphrases and international character sets. Passwords must undergo Unicode NFKC (Normalization Form KC) normalization upon submission to ensure character stability across client user agents.   

Elimination of Hints and Knowledge Questions: The application strictly excludes security questions and password hints, as their answers are vulnerable to automated scraping and social engineering.   

Breached Password Screening via the HIBP k-Anonymity API

NIST SP 800-63B-4 mandates checking prospective passwords against breach corpuses during registration, credential reset, and administrative updates. The platform satisfies this mandate by integrating the Have I Been Pwned (HIBP) Pwned Passwords API via k-anonymity:   

TypeScript
import { createHash } from 'node:crypto';

export async function checkPasswordBreached(password: string): Promise<boolean> {
  const sha1Hash = createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1Hash.slice(0, 5);
  const suffix = sha1Hash.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    method: 'GET',
    headers: { 'User-Agent': 'Aici-SecureApp-CivicAudit' },
    cache: 'no-store'
  });

  if (!response.ok) {
    // Fail closed to prevent compromised credentials from bypassing registration
    throw new Error('Credential breach verification service unavailable');
  }

  const responseText = await response.text();
  const hashLines = responseText.split('\r\n');
  
  for (const line of hashLines) {
    const [remoteSuffix] = line.split(':');
    if (remoteSuffix === suffix) {
      return true; // Password exists within known compromised data dumps
    }
  }

  return false;
}

The mathematical architecture of k-anonymity guarantees that the plain password never leaves the application boundary. By dispatching solely the 5-character hexadecimal SHA-1 prefix (16^5 = 1,048,576 discrete buckets), the remote service returns a cluster of matching hashes without learning which specific hash belongs to the user. The suffix comparison occurs strictly within volatile server memory.   

Multi-Factor Authentication (MFA) and NIST AAL2 Alignment

Multi-Factor Authentication is non-negotiable for administrative portals handling civic records. Under NIST SP 800-63B-4, Authenticator Assurance Level 2 (AAL2) mandates proof of possession of two distinct authentication factors: a memorized secret and a physical or software possession factor.   

WebAuthn Passkeys Versus TOTP
Technical Parameter	WebAuthn / Passkeys (FIDO2)	Time-Based One-Time Password (TOTP)
Foundational Standard	W3C Web Authentication Level 3 / FIDO2	RFC 6238 / RFC 4226
Phishing Vulnerability	Structurally Immune; cryptographic signatures are strictly bound to origin URL domain.	Susceptible; numeric tokens can be intercepted by real-time reverse proxies.
Cryptographic Primitives	Asymmetric cryptography (ECDSA P-256, Ed25519) within hardware-isolated enclaves.	Symmetric key derivation via HMAC-SHA-1/SHA-256 over 30-second time windows.
Ecosystem Libraries	@simplewebauthn/server and @simplewebauthn/browser	

node:crypto or @oslojs/otp

NIST AAL2 Status	

Fully satisfies phishing-resistant AAL2 criteria.

	

Satisfies standard AAL2 criteria; lacks phishing resistance.

  

WebAuthn passkeys constitute the primary second factor for Aici. Because the client platform computes cryptographic assertions using private keys permanently isolated inside hardware security modules (Apple Secure Enclave, Windows Hello TPM, or physical YubiKeys), an attacker cannot intercept or replay authentication data across an illegitimate domain. TOTP is implemented as an alternate secondary factor to support staff operating on older, non-FIDO2-compliant workstation environments.

Encrypting TOTP Shared Secrets at Rest

Storing raw TOTP shared secrets in plaintext within PostgreSQL presents an unnecessary vulnerability: an attacker who compromises the database could immediately generate valid 6-digit codes and bypass the second authentication factor entirely. To prevent this, all TOTP shared secrets are encrypted using authenticated symmetric encryption (AES-256-GCM) before being stored in the database:

TypeScript
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const CIPHER_ALGORITHM = 'aes-256-gcm';
const STORAGE_KEY = Buffer.from(process.env.MFA_ENCRYPTION_KEY!, 'hex');

export function encryptTotpSecret(plainSecret: string): { ciphertext: string; iv: string; tag: string } {
  const iv = randomBytes(12); // Standard 96-bit initialization vector for AES-GCM
  const cipher = createCipheriv(CIPHER_ALGORITHM, STORAGE_KEY, iv);

  let ciphertext = cipher.update(plainSecret, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return { ciphertext, iv: iv.toString('hex'), tag };
}

export function decryptTotpSecret(ciphertext: string, ivHex: string, tagHex: string): string {
  const decipher = createDecipheriv(CIPHER_ALGORITHM, STORAGE_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

Single-Use Recovery Code Mechanics

To prevent staff lockouts resulting from hardware failure or authenticator loss, the application generates a bundle of 10 single-use recovery codes upon successful MFA configuration. Each code contains 80 bits of cryptographic entropy, displayed as a grouped alphanumeric string (e.g., C3F9-81AB-44E2).

Critically, recovery codes must be treated with the same security controls as user passwords. Storing recovery codes in plaintext would nullify the security gained by encrypting TOTP secrets. Each recovery code is hashed using SHA-256 before being saved to the database. When a staff member uses a recovery code, the application hashes the input, locates the matching hash in PostgreSQL, marks it as consumed (used_at = NOW()), and grants access.

Enrollment and Activation Lifecycle

To prevent intermediate provisioning bypasses, MFA enrollment follows a two-phase activation lifecycle:

Initialization Phase: The authenticated staff member requests enrollment. The server generates a WebAuthn challenge or an encrypted TOTP seed and stores it in staff_mfa_credentials marked with is_verified = FALSE. The secret is not yet active for general authentication.

Verification Phase: The staff member must complete a challenge by providing a valid WebAuthn assertion or a 6-digit TOTP code generated from the newly presented configuration. Only upon verification does the server update is_verified to TRUE, persist the hashed recovery codes, and expose those codes to the user interface once. Unverified configurations are discarded after 15 minutes.

Session Management Architecture

Web application session security requires maintaining user state while minimizing the attack surface associated with session hijacking, fixation, and stale permissions.   

Database-Backed Stateful Sessions Versus Stateless JWTs

Stateless JSON Web Tokens are inappropriate for managing internal municipal operations. JWTs introduce significant operational and security liabilities:

Inability to Revoke Instantly: An issued JWT remains valid across the network until its cryptographic expiration expires. If a staff member’s account is compromised, the operator's role is demoted, or the device is stolen, the system cannot revoke that token without deploying a distributed blocklist, which defeats the purpose of stateless authentication.

Privilege Drift: When an administrator changes a staff member's permissions from admin to operator, an active JWT continues to assert administrative privileges until its expiration.

Information Exposure: Storing staff roles and IDs inside client-accessible tokens exposes internal operational architecture to client inspection.

Stateful, database-backed sessions solve these vulnerabilities. Because the application queries PostgreSQL for each request, account deactivations, permission revocations, and voluntary logouts take effect instantly across all active client connections.   

Token Entropy and Database-Side Token Hashing

Per OWASP ASVS 5.0 (V3.2.2 and V7.1.1), session tokens must provide at least 128 bits of entropy and must be stored within databases exclusively in an irreversible hashed format.   

The application generates session tokens using 32 cryptographically secure random bytes (256 bits of entropy) via crypto.randomBytes(32):

TypeScript
import { randomBytes, createHash } from 'node:crypto';

export function generateSessionToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

The raw 64-character hexadecimal token is transmitted to the client browser inside an encrypted, secure cookie. The server hashes this token with SHA-256 before inserting or querying it in PostgreSQL. Storing only the token hash ensures that even if an attacker extracts the database through an injection vulnerability or backup leak, the stolen session hashes cannot be used to forge cookies or hijack active staff sessions.   

Session Lifecycle and Timeout Boundaries

Sessions follow strict lifecycle boundaries to balance security and operational usability:

Idle Timeout (Inactivity): Inactivity expiration is set to 30 minutes. To reduce database write overhead on Neon through PgBouncer, the last_active_at timestamp is updated conditionally, only writing when the recorded timestamp is older than 5 minutes.

Absolute Timeout: The session terminates 12 hours after its initial creation, regardless of user activity, requiring staff to re-authenticate at the start of each operational shift.

Session Fixation Neutralization: The session identifier must be rotated upon every successful authentication, upon MFA step-up completion, and whenever user privileges change.   

Revocation Cascades: Explicit user logout immediately purges the active session record from the database. Resetting a password or updating account status executes an atomic deletion of all active sessions for that user_id, instantly revoking access across all devices.   

Cookie Configuration and Localhost Nuances

Session cookies are issued using the following header configuration:

HTTP
Set-Cookie: __Host-aici_session=<raw_token>; Path=/; Secure; HttpOnly; SameSite=Lax

The __Host- prefix enforces that the cookie is accepted only if it includes Path=/, omits any Domain attribute (making it a host-only cookie), and is delivered over HTTPS. This prevents adjacent subdomains from injecting or overwriting session cookies.   

The HttpOnly flag prevents client-side JavaScript from accessing the cookie via document.cookie, mitigating credential theft via cross-site scripting (XSS).   

The Secure flag directs the user agent to transmit the cookie over TLS connections exclusively.   

SameSite=Lax permits top-level safe GET navigations (such as clicking an internal link from an operational email dispatch) while withholding the cookie on cross-site POST requests, state-changing AJAX calls, and embedded iframes, blocking Cross-Site Request Forgery (CSRF) without breaking navigational workflows. SameSite=Strict provides stronger isolation but marks incoming staff links as unauthenticated on initial navigation, degrading usability for municipal employees.   

Modern browsers treat http://localhost as an intrinsically secure origin for standard Secure flags. However, Chromium implementations enforce strict HTTPS origin validation for cookies utilizing the __Host- prefix (Chromium Issue 40202941). Consequently, Google Chrome and Microsoft Edge reject Set-Cookie headers containing __Host- when served over unencrypted http://localhost, whereas Mozilla Firefox accepts them.   

To maintain parity between development environments and production deployments:

Local development should terminate TLS directly using tools such as mkcert or Next.js experimental local HTTPS (next dev --experimental-https), allowing developers to use identical cookie configurations locally and in production.

If development must proceed over plaintext HTTP, the cookie configuration must selectively omit the __Host- prefix in non-production environments while enforcing it in production:

TypeScript
const isProduction = process.env.NODE_ENV === 'production';

export const SESSION_COOKIE_NAME = isProduction ? '__Host-aici_session' : 'aici_session';

export const SESSION_COOKIE_CONFIG = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

Next.js Framework Architecture and Vulnerability Surface
Architectural Authorization Bypass: CVE-2025-29927

In March 2025, a critical security vulnerability designated CVE-2025-29927 (CVSS 9.1) was disclosed, revealing an architectural flaw in Next.js middleware authorization pipelines.   

Next.js uses an internal header, x-middleware-subrequest, to track subrequests initiated by the middleware layer and prevent infinite request loops during routing rewrites. Because vulnerable framework versions (Next.js versions prior to 12.3.5, 13.5.9, 14.2.25, and 15.2.3) implicitly trusted this header on external client requests, an attacker could spoof it directly:   

HTTP
GET /admin/staff-management HTTP/1.1
Host: aici.gov.md
x-middleware-subrequest: middleware

Upon receiving this request, the Next.js runtime assumed that middleware had already executed upstream and skipped the entire middleware pipeline. In applications relying solely on middleware for route protection, unauthenticated users could access gated paths, view sensitive operational pages, and bypass access controls entirely.   

Defense-in-Depth Verification Layers

CVE-2025-29927 demonstrates that middleware must never serve as the sole security boundary in a modern web framework. Robust authentication architectures must employ defense-in-depth across multiple independent layers:   

Edge Sanitization: The external reverse proxy (such as Nginx, Caddy, or a cloud ingress controller) must strip the x-middleware-subrequest header from all incoming client requests.   

Middleware Routing Guard: Next.js middleware functions purely as an optimistic routing guard, handling user redirects to login pages to improve client-side UX.   

Data Access Layer (DAL) Enforcement: Every Server Component reading restricted data, every Server Action mutating database state, and every Route Handler exposing JSON endpoints must independently verify the session against PostgreSQL through an isolated Data Access Layer.

TypeScript
// lib/auth/dal.ts
import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { sql } from '@/lib/db';
import { hashSessionToken, SESSION_COOKIE_NAME } from './session';

export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawToken) {
    return { isAuth: false, user: null };
  }

  const tokenHash = hashSessionToken(rawToken);

  const [session] = await sql`
    SELECT 
      s.id as session_id,
      u.id as user_id,
      u.email,
      u.role,
      u.is_active
    FROM staff_sessions s
    JOIN staff_users u ON s.user_id = u.id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
      AND s.idle_expires_at > NOW()
      AND u.is_active = TRUE
    LIMIT 1;
  `;

  if (!session) {
    return { isAuth: false, user: null };
  }

  return {
    isAuth: true,
    user: {
      id: session.user_id,
      email: session.email,
      role: session.role,
    }
  };
});

Using React’s cache() utility ensures that multiple component checks within a single server rendering pass execute the database lookup only once, providing zero-overhead defense-in-depth across the entire component hierarchy.

Runtime Environment Boundaries

Next.js separates processing between the Edge Runtime and the standard Node.js Runtime. The Edge Runtime executes inside lightweight V8 worker sandboxes that lack native Node.js APIs and direct TCP networking. Because PostgreSQL drivers (such as postgres.js) require direct TCP connections, and @node-rs/argon2 relies on compiled native bindings, core authentication operations cannot run within the Edge Runtime. All authentication handlers, session decoders, and database interactions must be explicitly configured to run on the standard Node.js runtime:   

TypeScript
export const runtime = 'nodejs';

Cross-Site Request Forgery Protections

Server Actions: Next.js provides built-in CSRF defenses for Server Actions. When handling actions, the framework validates that the request Origin header matches the Host or X-Forwarded-Host header, automatically dropping mismatched cross-site requests.

Route Handlers (/api/...): Next.js does not provide automated CSRF validation for custom Route Handlers. Any state-changing Route Handler (invoked via POST, PUT, PATCH, or DELETE) must explicitly check origin headers:

TypeScript
// lib/auth/csrf.ts
import { headers } from 'next/headers';

export async function assertOriginHeader(): Promise<void> {
  const headerList = await headers();
  const origin = headerList.get('origin');
  const host = headerList.get('host');

  if (!origin) {
    throw new Error('Access Denied: Missing Origin Header');
  }

  const originHost = new URL(origin).host;
  if (originHost !== host) {
    throw new Error('Security Violation: Untrusted Origin Cross-Site Request');
  }
}

Server Secret Containment and Static Caching Hazards

To prevent accidental inclusion of database secrets, salts, and encryption keys in client-side JavaScript bundles, every module managing authentication secrets must import the runtime safety package:

TypeScript
import 'server-only';

This directive causes the build compiler to throw an error if any component or utility in the module is inadvertently imported into a Client Component.

Additionally, Next.js implements aggressive page and data caching by default. If an administrative route or dashboard view is statically pre-rendered, an authenticated operator's view could be saved to a shared cache and served to unauthorized users. To guarantee that authenticated pages are rendered dynamically on every request, authenticated dashboard layouts must explicitly disable static caching:

TypeScript
export const dynamic = 'force-dynamic';
export const revalidate = 0;

Next.js Version Upgrade Evaluation

Next.js 14.2 contains significant unresolved vulnerabilities, including CVE-2025-29927 (in versions below 14.2.25) and multiple React Server Component protocol issues (CVE-2025-32421 and CVE-2025-66478). Beyond direct security advisories, Next.js 14.2 caches fetch operations and GET route handlers by default, creating continuous risk of caching data across authenticated sessions.   

Next.js 15 resolves these concerns by introducing secure-by-default un-cached network fetches, making cookies() and headers() APIs asynchronous to eliminate race conditions, and fully mitigating CVE-2025-29927 in versions 15.2.3 and higher. Upgrading to Next.js 15 before implementing the authentication architecture is strongly recommended to establish a secure, patched foundation.   

Abuse Prevention and Anti-Automation Without Redis

Deploying an application without an auxiliary Redis instance requires leveraging PostgreSQL for rate limiting and threat mitigation, while accounting for the pooling behaviors of the underlying infrastructure.   

PostgreSQL Rate Limiting with PgBouncer Pooling

Neon routes database connections through PgBouncer operating in transaction mode. In this mode, PgBouncer returns the database connection to the shared pool at the end of each transaction. This design breaks stateful client-side prepared statements, because a statement prepared on connection instance A will not exist when subsequent queries execute on connection instance B.   

The application driver, postgres.js, must be initialized with prepare: false to disable prepared statements and prevent prepared statement "_pgstmt_1" does not exist exceptions:   

TypeScript
// lib/db.ts
import postgres from 'postgres';

export const sql = postgres(process.env.DATABASE_URL!, {
  prepare: false, // Mandatory for PgBouncer in transaction mode
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

Rate limiting uses an atomic sliding window implemented via an upsert query in PostgreSQL, tracking attempts across both IP addresses and target email accounts:

TypeScript
export async function verifyRateLimit(
  rateKey: string,
  limitThreshold: number,
  windowDurationSeconds: number
): Promise<{ success: boolean; retryAfter: number }> {
  const [record] = await sql`
    INSERT INTO staff_rate_limits (rate_key, attempts, first_attempt_at, last_attempt_at)
    VALUES (${rateKey}, 1, NOW(), NOW())
    ON CONFLICT (rate_key) DO UPDATE
    SET
      attempts = CASE
        WHEN staff_rate_limits.first_attempt_at < NOW() - (${windowDurationSeconds} || ' seconds')::INTERVAL
        THEN 1
        ELSE staff_rate_limits.attempts + 1
      END,
      first_attempt_at = CASE
        WHEN staff_rate_limits.first_attempt_at < NOW() - (${windowDurationSeconds} || ' seconds')::INTERVAL
        THEN NOW()
        ELSE staff_rate_limits.first_attempt_at
      END,
      last_attempt_at = NOW()
    RETURNING attempts, first_attempt_at;
  `;

  if (record.attempts > limitThreshold) {
    const resetTime = new Date(record.first_attempt_at).getTime() + windowDurationSeconds * 1000;
    const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
    return { success: false, retryAfter };
  }

  return { success: true, retryAfter: 0 };
}

Progressive Backoff Versus Account Lockout

Hard account lockouts (such as permanently disabling an account after five incorrect password attempts) are explicitly prohibited by NIST SP 800-63B-4. Hard lockouts allow an attacker to launch an unauthenticated denial-of-service attack against municipal operations by deliberately submitting bad passwords for known staff email addresses, locking out staff members from their accounts.

The system instead combines IP-level throttling with exponential progressive backoff. Between attempts one through five, the login pipeline operates normally. Starting with attempt six, each failed attempt introduces an exponential delay before returning a response (2 seconds, 4 seconds, 8 seconds), effectively neutralizing automated brute-force scripts. Once an account exceeds nine failed attempts, that specific authentication vector requires completing an out-of-band challenge or proof-of-work before accepting further attempts, keeping the account accessible while blocking brute-force attacks.

Proof-of-Work Anti-Automation: ALTCHA Integration

Traditional CAPTCHA providers (such as Google reCAPTCHA) capture client telemetry and track users, violating data minimization principles and data protection regulations. The platform instead integrates ALTCHA, an open-source, privacy-preserving proof-of-work anti-automation challenge.   

When the system detects repeated login failures from an IP address, it issues an ALTCHA challenge using altcha-lib:   

TypeScript
// lib/auth/altcha.ts
import { createChallenge, verifySolution } from 'altcha-lib';

const ALTCHA_SECRET = process.env.ALTCHA_HMAC_KEY!;

export async function generatePoW() {
  return await createChallenge({
    hmacKey: ALTCHA_SECRET,
    algorithm: 'SHA-256',
    maxNumber: 50000, // Requires ~1-2 seconds of client compute time
    expires: new Date(Date.now() + 5 * 60 * 1000), // 5-minute validity
  });
}

export async function validatePoW(solutionPayload: any): Promise<boolean> {
  return await verifySolution(solutionPayload, ALTCHA_SECRET);
}

The user agent calculates the cryptographic challenge inside an isolated web worker and submits the result with the login request. The server verifies the solution in less than a millisecond, imposing a computational cost on attackers while keeping the verification process fully self-hosted.   

Anti-Enumeration and Side-Channel Timing Neutralization

User enumeration vulnerabilities allow attackers to discover valid municipal staff accounts through differences in system responses or processing times.   

To prevent user enumeration, the system enforces two primary controls:

Generic error responses ensure that all login failures return identical messaging: "Invalid credentials. Please verify your email and password." Password reset endpoints display the same confirmation message regardless of whether an email address exists in the system: "If the email matches an active account, a password reset link has been dispatched."   

When an attacker submits an unregistered email address, a naive implementation returns immediately after the database lookup fails (≈15 ms). If the user exists, the application executes a full Argon2id verification (≈250 ms). This timing difference allows attackers to identify valid staff accounts. The platform neutralizes this side-channel by computing a dummy Argon2id hash whenever an email lookup fails:

TypeScript
import * as argon2 from '@node-rs/argon2';

const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQxOTQ1Ng$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export async function verifyPasswordConstantTime(
  suppliedPassword: string,
  userRecord: { password_hash: string } | null
): Promise<boolean> {
  if (!userRecord) {
    // Execute dummy hash to match computation time
    await argon2.verify(DUMMY_HASH, suppliedPassword);
    return false;
  }
  return await argon2.verify(userRecord.password_hash, suppliedPassword);
}

Account Lifecycle and Compliance with Moldovan Law 195/2024
Staff Account Lifecycle

Municipal staff accounts cannot be created through public self-registration. Staff onboarding uses an invite-only lifecycle:

Account Invitation: An administrator creates an invitation specifying the user's municipal email address and assigned role (operator or admin).

Token Generation: The application generates 32 cryptographically secure random bytes (256 bits of entropy), stores the SHA-256 hash of this token in staff_credential_tokens, and sets a 48-hour expiration.

Invitation Delivery: The staff member receives an activation URL containing the raw token: https://aici.gov.md/staff/setup?token=<raw_token>.

Credential Enrollment: Upon navigating to the link, the server hashes the provided token and verifies that it is active and unexpired. The user then selects a password (validated against NIST SP 800-63B-4 requirements and HIBP breach corpuses), completes MFA enrollment, and activates the account.   

Initial Administrator Bootstrapping

To avoid deploying temporary, insecure administrative setup pages, the initial super-administrator account is provisioned out-of-band via an automated CLI script executed directly on the host server:

Bash
node scripts/bootstrap-admin.mjs --email="admin@chisinau.md" --role="admin"

The script screens the provided password against security policies, computes the Argon2id hash with the application pepper, writes the user record directly to PostgreSQL, and exits.

Password Reset Workflows

Administrative Password Reset: Administrators can flag an account for a forced password reset (force_password_reset = TRUE). On their next request, the user's active sessions are terminated, and they are redirected to a forced credential update view.

Self-Service Reset via Email: The staff member requests a reset link through the generic reset form. The system generates a single-use, 256-bit token that expires in 15 minutes, stores its SHA-256 hash in staff_credential_tokens, and emails the link. Upon successful redemption, the token is marked as consumed, the user's password hash is updated, and all existing active sessions are deleted, terminating access on any other devices.   

Account Deactivation

When a staff member leaves the organization or is suspended, an administrator sets their account status to is_active = FALSE. The application updates the account and immediately deletes all active sessions in a single transaction:

SQL
BEGIN;
UPDATE staff_users 
SET is_active = FALSE, updated_at = NOW() 
WHERE id = $1;

DELETE FROM staff_sessions 
WHERE user_id = $1;
COMMIT;

Because the Data Access Layer validates that u.is_active = TRUE on every request, suspended users lose access instantly, even if they have an active browser session.   

Compliance with Moldovan Law 195/2024

Adopted on July 25, 2024, Legea nr. 195/2024 privind protecția datelor cu caracter personal enters into legal force on August 23, 2026, replacing the previous Law 133/2011. Law 195/2024 directly aligns Moldovan data protection law with the European Union General Data Protection Regulation (GDPR - Regulation EU 2016/679).   

Law 195/2024 Provision	Regulatory Requirement	Application Implementation
Article 5(1)(c) / Data Minimization	

Processing must be limited to what is strictly necessary for operational purposes.

	

Citizens submit reports pseudonymously without accounts. Staff audit logs record user actions without logging cleartext passwords, session tokens, or non-essential telemetry.

Article 24 & 32 / Security Measures	

Implement technical and organizational measures to ensure appropriate data security.

	

Enforce Argon2id password hashing, encrypt TOTP secrets with AES-256-GCM, and hash session tokens in PostgreSQL.

Article 30 / Records of Processing	

Maintain detailed records of processing activities carried out under the controller's authority.

	

Record every staff action on citizen reports (e.g., viewing GPS coordinates, changing report status) in an immutable audit table.

Articles 33 & 34 / Breach Notification	

Report security incidents and personal data breaches to the CNPDCP within 72 hours.

	

Provide an immutable audit log of all authentication events, privilege changes, and access failures to support forensic incident analysis.

  
Reference Database Schema and Phased Implementation Plan
Complete PostgreSQL Schema Specification
SQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Staff Users Table
CREATE TABLE staff_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('operator', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    force_password_reset BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_users_email ON staff_users(email);

-- 2. Staff Sessions Table (Stored Hashes per OWASP ASVS)
CREATE TABLE staff_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    idle_expires_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_staff_sessions_lookup 
ON staff_sessions(token_hash, expires_at, idle_expires_at);

-- 3. Staff Multi-Factor Credentials Table
CREATE TABLE staff_mfa_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
    mfa_type VARCHAR(32) NOT NULL CHECK (mfa_type IN ('totp', 'webauthn')),
    -- Encrypted storage for TOTP secrets (AES-256-GCM)
    encrypted_secret TEXT,
    secret_iv VARCHAR(32),
    secret_tag VARCHAR(32),
    -- WebAuthn Public Key Storage
    webauthn_credential_id TEXT UNIQUE,
    webauthn_public_key BYTEA,
    webauthn_counter BIGINT DEFAULT 0,
    webauthn_transports TEXT[],
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_mfa_user ON staff_mfa_credentials(user_id);

-- 4. Hashed Single-Use MFA Recovery Codes
CREATE TABLE staff_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
    code_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of recovery code
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_recovery_lookup 
ON staff_recovery_codes(user_id, code_hash) 
WHERE used_at IS NULL;

-- 5. Invitations and Password Resets
CREATE TABLE staff_credential_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES staff_users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    token_type VARCHAR(32) NOT NULL CHECK (token_type IN ('INVITE', 'PASSWORD_RESET')),
    role VARCHAR(32) CHECK (role IN ('operator', 'admin')),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_tokens_lookup 
ON staff_credential_tokens(token_hash, token_type);

-- 6. In-Database Sliding-Window Rate Limiting Table
CREATE TABLE staff_rate_limits (
    rate_key VARCHAR(128) PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 1,
    first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_rate_limits_window ON staff_rate_limits(last_attempt_at);

-- 7. Audit Log Table (Compliant with Moldovan Law 195/2024)
CREATE TABLE staff_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES staff_users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    target_resource VARCHAR(64),
    target_id UUID,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(16) NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE')),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_audit_actor ON staff_audit_log(actor_id);
CREATE INDEX idx_staff_audit_action ON staff_audit_log(action);
CREATE INDEX idx_staff_audit_created ON staff_audit_log(created_at);

Phased Implementation Roadmap

The implementation plan spans three weeks, organizing development into three sequential phases that establish a verified, secure core before introducing advanced protections.

Development Phase	Day Schedule	Milestone Deliverables	Verification Strategy
Phase 1: Secure Core MVP	Days 1–2	

• Setup @node-rs/argon2 and postgres.js with prepare: false.

• Apply initial migrations for staff_users and staff_sessions.

• Implement Zod schemas enforcing 15-character minimums.

	

Verify un-prepared query execution against Neon's transaction-mode PgBouncer. Confirm cross-platform compilation on Windows and Linux.

	Days 3–4	

• Implement Argon2id hashing with application pepper.

• Integrate HIBP k-anonymity screening API.

• Build session generator with SHA-256 token hashing.

	

Confirm API correctly flags compromised passwords. Verify that database contains only SHA-256 session token hashes.

	Day 5	

• Implement session cookies (__Host-, HttpOnly, Secure, SameSite=Lax).

• Build login and logout Route Handlers with session rotation.

	

Verify that modern browsers reject insecure session modifications. Confirm that logouts purge session records from PostgreSQL.

Phase 2: MFA & Account Lifecycle	Days 6–7	

• Implement WebAuthn registration and verification via @simplewebauthn.

• Store passkey public keys and counters in staff_mfa_credentials.

	Verify hardware-backed passkey authentication across Chrome and Firefox. Confirm replay prevention via challenge verification.
	Day 8	

• Implement TOTP fallback support via node:crypto.

• Build AES-256-GCM symmetric encryption for TOTP secrets at rest.

	Verify that TOTP database records contain only encrypted ciphertexts, IVs, and auth tags.
	Day 9	

• Implement single-use recovery code generator.

• Build SHA-256 recovery code hashing and redemption checks.

	Confirm that redeemed recovery codes cannot be reused and are immediately marked as consumed.
	Day 10	

• Build out-of-band CLI administrator bootstrapping script.

• Build single-use hashed token workflows for staff invitations and password resets.

	

Verify end-to-end invite and password reset flows. Ensure used reset tokens are invalidated immediately upon redemption.

Phase 3: Hardening & Compliance	Days 11–12	

• Implement sliding-window rate limiting in PostgreSQL.

• Integrate ALTCHA self-hosted proof-of-work challenges.

	Verify that excessive login attempts trigger proof-of-work requirements. Confirm that IP-based limits execute before password hashing.
	Day 13	

• Implement constant-time dummy Argon2id verification.

• Standardize generic error messaging across login and reset routes.

	Run network latency benchmarks to verify that requests for existing and non-existing accounts exhibit identical response timing profiles.
	Day 14	

• Upgrade application base to Next.js 15+.

• Centralize Data Access Layer checks across all Server Components and Actions.

• Add assertSameOrigin() checks to Route Handlers.

• Enforce dynamic execution on administrative layouts.

	

Verify that requests sending x-middleware-subrequest are blocked at the DAL layer. Confirm that authenticated administrative views are never cached.

	Day 15	

• Implement audit logging triggers compliant with Moldovan Law 195/2024.

• Conduct end-to-end penetration testing covering session fixation, CSRF, and account enumeration.

	

Verify that operator triage actions produce auditable log entries. Confirm that audit logs contain zero plaintext credentials or session secrets.

  
Operational Summary

Building the authentication system for Aici on custom cryptographic primitives provides the control transparency and demonstrable security required for an advanced application security curriculum. By combining Argon2id hashing, encrypted TOTP secrets, WebAuthn passkeys, database-backed session hashing, and PostgreSQL-driven rate limiting, the platform establishes strong protections against common web attack vectors.   

At the application layer, moving beyond Next.js middleware to enforce defense-in-depth within a centralized Data Access Layer neutralizes framework-level authorization bypasses such as CVE-2025-29927. Finally, pairing these technical controls with structured audit logging and strict data minimization ensures that municipal triage operations comply fully with the requirements of Moldovan Law 195/2024 ahead of its August 2026 enforcement date.   

## Sources used in the report

- Legea nr. 195/2024 privind protecția datelor cu caracter personal (datepersonale.md)
- The Copenhagen Book - GitHub (github.com)
- Better Auth Review · Start with Identity (startwithidentity.com)
- Best Open Source Auth Tools & Auth Software for Enterprises [2026] (cerbos.dev)
- The Faces Behind Open Source Projects: Pilcrow, author of Lucia Auth (wasp.sh)
- A fresh start · lucia-auth lucia · Discussion #1714 - GitHub (github.com)
- I tested every major auth library for Next.js in 2026 - LogRocket Blog (blog.logrocket.com)
- Clerk vs Auth0 vs NextAuth in 2026 | Cadence blog (cadence.withremote.ai)
- Insufficient Verification of Data Authenticity - CVEs - page 1 - Feedly (feedly.com)
- Better Auth (YC P25) – Authentication Framework for TypeScript (news.ycombinator.com)
- Better Auth - Docs - Appwrite (appwrite.io)
- r/sveltejs on Reddit: Connection pooling in SvelteKit + Postgres (reddit.com)
- Is Better Auth really any better : r/nextjs - Reddit (reddit.com)
- ASVS Checker — OWASP Application Security Verification (aquilax.ai)
- NIST password guidelines - Optro (optro.ai)
- Cleanup list of approved Hash Functions for Password Storage #2991 (github.com)
- Password Hashing in 2026: bcrypt, Argon2, scrypt, PBKDF2 (guptadeepak.com)
- Password Security Storage: Best Practices & Cybersecurity Methods (huntress.com)
- Web and Chrome extension memory usage with Argon2id set to (reddit.com)
- Argon2id defaults are much higher than OWASP recommendations (reddit.com)
- NIST 2025 password recommendations: what's changed (captaindns.com)
- Example password policy — 2026 update (NIST SP 800-63B-4) (my127001.pl)
- NIST SP 800-63B-4 Password Guidelines - ITECS (itecsonline.com)
- Secure Authentication with Cookies (thenile.dev)
- Set-Cookie header - HTTP - MDN Web Docs (developer.mozilla.org)
- Free Cookie Security Analyzer | ismycodesafe.com (ismycodesafe.com)
- When to use HTTPS for local development | Articles - web.dev (web.dev)
- Firefox sends secure cookies to localhost - Stack Overflow (stackoverflow.com)
- Cookies with __Host prefix are rejected on `http://localhost` (issues.chromium.org)
- Understanding CVE-2025-29927: The Next.js Middleware (securitylabs.datadoghq.com)
- CVE-2025-29927 Authorization Bypass in Next.js Middleware | Snyk (snyk.io)
- CVE-2025-29927: Next.js Middleware Authorization Bypass - OffSec (offsec.com)
- CVE-2025-29927: Next.js Middleware Authorization Bypass (projectdiscovery.io)
- CVE-2025-29927 Detail. - NVD (nvd.nist.gov)
- Module P-11: Connection Pooling Failure Modes: PgBouncer (academy.jatinjainsaraf.com)
- CVE-2025-32421 Detail - NVD - NIST (nvd.nist.gov)
- Security Advisory: CVE-2025-66478 - Next.js (nextjs.org)
- next 14.2.25 - Snyk Vulnerability Database (security.snyk.io)
- Postgres.js - The Fastest full featured PostgreSQL client for ... - GitHub (github.com)
- altcha-lib - NPM (npmjs.com)
- How to Protect your React Forms from Bots for Free with Altcha (levelup.gitconnected.com)
- altcha-org/altcha-starter-nodejs-ts - GitHub (github.com)
- Protectia datelor cu caracter personal | e-Legal.md (e-legal.md)
- Legea privind protecția datelor cu caracter personal publicată în (datepersonale.md)
- Noua lege privind protecția datelor cu caracter personal publicată (contabilsef.md)
- Noua Lege Privind Protecția Datelor cu Caracter Personal (aci.md)
- Noua lege privind protecția datelor – principalele surse de (juridicemoldova.md)
- NOTA DE FUNDAMENTARE a proiectului de lege privind protecția (particip.gov.md)
