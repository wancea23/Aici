# c4 - tech stack & sovereign architecture blueprint

> Source: https://share.gemini.google/GTxAki6E1Z76
> Harvested 2026-09-10 (project: Aici).

---

Architectural Blueprint for a Sovereign, Secure Citizen Issue-Reporting and Municipal Triage Platform

Municipal digital infrastructure requires an uncompromising balance between public accessibility, cryptographic integrity, personal data protection, and operational simplicity. A platform designed for citizen incident reporting—encompassing the ingestion of geolocated photographic evidence from the public and dynamic spatial triage by municipal operators—must maintain strict data sovereignty, resist malicious binary injection and denial-of-service vectors, and operate within predictable fiscal boundaries. This report provides an exhaustive, source-grounded architectural specification for engineering, securing, and deploying an open-source, sovereign issue-reporting ecosystem.

1. Client Application Layer: Mobile-First Ingestion Frameworks

Public-facing civic technologies encounter severe user acquisition attrition. Citizens engage with municipal intake platforms episodically, typically during unexpected encounters with public infrastructure failures such as water main ruptures, road damage, or illegal waste disposal. Requiring an individual to download a multi-megabyte native binary from an application store at the moment of incident observation introduces catastrophic drop-off rates. The client architecture must therefore reconcile zero-friction public ingestion with low-level device hardware access, specifically the camera sensor, Global Navigation Satellite System (GNSS) hardware, and local persistence runtimes.

Evaluation Metric	Native Application (Flutter / React Native)	Progressive Web App (PWA)	Standard Responsive Web App
Distribution & Friction	High friction; mandatory App Store / Play Store installation	Zero friction; instant execution via URL or QR code dispatch	Zero friction; instant browser execution
Camera Hardware Access	Low-level direct API access via Camera2 / AVFoundation	Declarative capture via HTML5 file attributes or MediaDevices	Declarative file capture via <input type="file">
Geolocation Precision	Direct GNSS chip access; mock-location hardware flags	High-accuracy W3C Geolocation API; OS-abstracted	High-accuracy W3C Geolocation API; OS-abstracted
Offline Persistence	Unrestricted background execution via OS task schedulers	

Service Worker Cache API and IndexedDB storage

	None; active network connection strictly mandatory
Background Sync	Fully supported via Android WorkManager and iOS BGTaskScheduler	

Supported on Chromium; blocked entirely on WebKit/iOS

	Unsupported
Maintenance Burden	Dual-platform builds, toolchain drift, store certification	Single unified codebase for mobile, tablet, and desktop	Single unified codebase; zero offline service workers
  
Hardware Access and Operating System Constraints

Native frameworks bind directly to platform-native multimedia frameworks, enabling fine-grained control over optical sensor exposure, manual focal lengths, and camera sensor selection. In the web ecosystem, modern Progressive Web Apps interact with imaging hardware through two discrete mechanisms: declarative capture and real-time streaming.

Declarative capture, invoked through <input type="file" accept="image/*" capture="environment">, delegates image acquisition directly to the host operating system's native camera application. When a citizen triggers this element, the browser suspends its execution context, opens the platform's native camera application, captures a high-resolution photograph, and returns an immutable file object to the web runtime. This approach avoids the complex WebRTC canvas pipelines and memory pressure associated with navigator.mediaDevices.getUserMedia(), making it resilient across low-tier mobile hardware.

Geolocation acquisition in native environments interfaces with Google Play Services FusedLocationProviderClient or Apple CoreLocation, exposing diagnostic telemetry such as satellite constellations, dilution of precision, and operating system mock-location detection flags (isFromMockProvider()). Web applications access coordinates through the W3C Geolocation API (navigator.geolocation.getCurrentPosition()).

Configuring the options object with enableHighAccuracy: true, maximumAge: 0, and a strict acquisition timeout forces the underlying mobile operating system to activate hardware GPS chips rather than relying solely on coarse cell-tower or Wi-Fi triangulation. Because web runtimes lack access to low-level mock-provider flags, the application cannot determine with cryptographic certainty whether an incoming coordinate has been spoofed by client-side developer instrumentation. Consequently, positional verification must be reinforced by backend heuristic plausibility checks and network Autonomous System (AS) cross-referencing.

Offline resiliency presents notable platform disparities. In mobile environments where network connectivity is intermittent, a reporting application must allow users to capture photos, record location markers, and queue submissions locally. Native environments execute deferred background network dispatches without user intervention via operating system background tasks.

In the web domain, Progressive Web Apps leverage the Service Worker lifecycle, storing serialized metadata and binary image blobs inside IndexedDB. Under Google Chrome and modern Chromium variants on Android, the W3C Background Synchronization API (SyncManager) enables the service worker to defer uploads until connectivity returns, executing the network request even if the browser tab has been dismissed.   

WebKit on Apple iOS maintains strict architectural restrictions:

Apple’s WebKit engine does not implement the Background Synchronization API, the Background Fetch API, or Periodic Background Sync.   

If an iOS user submits an incident report while traversing an offline zone and closes the Safari browser, the transaction remains halted within IndexedDB.   

The synchronization pipeline cannot resume until the user explicitly reopens the application, at which point standard lifecycle event listeners (window.addEventListener('online') or document.addEventListener('visibilitychange')) can detect network restoration and drain the IndexedDB submission queue.   

Safari enforces a strict 7-day eviction policy on client-side storage for web applications that have not been explicitly installed to the Home Screen, meaning uninstalled web application data is purged after a week of disuse.   

While iOS 16.4 introduced Web Push support to WebKit, notifications are strictly conditional upon the citizen manually executing the "Add to Home Screen" workflow through Safari's Share Sheet.   

Client Architectural Recommendation

For a small engineering team delivering an MVP, a Progressive Web App constructed with a modern frontend framework (such as React or Vue bundled via Vite and configured with vite-plugin-pwa) represents the most pragmatically sound architecture.   

Building native applications requires maintaining separate toolchains, navigating the continuous maintenance overhead of native dependencies, paying annual developer organization fees, and waiting for centralized app store review cycles. A single Progressive Web App codebase serves both mobile reporting citizens and desktop municipal triage dispatchers.

The client workflow must rely on declarative <input capture="environment"> to eliminate custom canvas streaming overhead, store pending payloads inside an IndexedDB transaction queue, and provide visual indicators informing iOS users that their offline submissions will synchronize the moment the application is brought back to the foreground under network coverage.   

2. Cartographic Pipeline and Spatial Data Architecture

Spatial data processing forms the foundation of incident dispatching. A municipal triage platform requires sub-meter accuracy, support for dynamic administrative layer styling, efficient proximity lookups, and clustering algorithms capable of detecting duplicate submissions.

Dimension	Self-Hosted Open-Source Stack (MapLibre + PostGIS)	Proprietary Commercial Platform (Google Maps Platform)
Fiscal Predictability	Bounded compute costs; zero volumetric licensing or request fees	Metered pay-per-use ($7.00/1k dynamic map loads, $5.00/1k geocodes)
Data Residency	Absolute; coordinates and images never leave municipal infrastructure	Geolocation coordinates and telemetry traverse vendor cloud regions
Vendor Independence	Full data portability via standard OGC, GeoJSON, and MVT formats	Proprietary JavaScript styling APIs; strict export restrictions
Offline Caching	Locally hosted vector tiles (PMTiles/MBTiles) function on isolated LANs	Terms of Service prohibit storing or caching map tiles offline
Client-Side Map Rendering Engines: Leaflet vs. MapLibre GL JS

Leaflet renders spatial layers primarily by manipulating Document Object Model (DOM) elements and raster HTML5 canvases. It is lightweight (approximately 40 KB minified and gzipped), exhibits low initial parsing overhead, and operates reliably on legacy low-power mobile devices. However, Leaflet's architectural model degrades when handling thousands of interactive vector points simultaneously. Layer styling is predominantly static, and rendering vector tiles requires external plugins that convert protobuf geometries into SVG or 2D canvas elements, causing frame-rate degradation during rapid panning.

MapLibre GL JS is an open-source, community-led fork of the Mapbox GL JS project prior to its transition to a proprietary license. It uses a hardware-accelerated WebGL/WebGPU rendering pipeline that offloads tile parsing, geometric transformations, and cartographic symbol placement directly to the client's Graphics Processing Unit (GPU). MapLibre natively consumes Mapbox Vector Tile (MVT) protocols, supports smooth fractional zooming and continuous map rotation, and handles dynamic styling rules calculated per-frame via client-side expressions.   

For the citizen reporting client—where the user only needs to verify an incident pin on a basemap—Leaflet is computationally efficient. For the municipal dispatch dashboard, MapLibre GL JS is essential: it enables operators to navigate thousands of dynamic incident records, toggle complex municipal utility boundaries, and filter layers smoothly on the GPU without inducing browser thread contention.   

Sovereign Vector Tile Serving Architecture

Deploying an open-source cartographic stack requires decoupling base cartography from real-time dynamic application data. Basemaps change infrequently and encompass massive geographic footprints, whereas incident layers fluctuate continuously as citizens submit and resolve issues.

Vector Tile Server	Primary Language	Data Input Sources	Architectural Profile & Operational Notes	Software License
Martin	Rust	

PostGIS tables, functions, PMTiles, MBTiles

	

High-throughput, low-memory asynchronous daemon; ideal for dynamic spatial layers

	

Dual Apache-2.0 / MIT


pg_tileserv	Go	

PostGIS database connections exclusively

	

Minimalist proxy translating HTTP tile bounds into ST_AsMVT queries

	

Apache-2.0


TileServer GL	JavaScript (Node.js)	

MBTiles archives

	

Wraps MapLibre GL Native to serve vector tiles and raster fallbacks; high memory footprint

	

BSD-2-Clause


Static PMTiles	Static Web Server	

Single .pmtiles archive via HTTP Range requests

	Zero execution daemon; served directly via Caddy/Nginx; ideal for static basemaps	BSD-3-Clause
  

The most resilient, sovereign architecture combines static basemaps with dynamic vector tile streaming:

Basemap Foundation: Pre-render OpenStreetMap data for the municipality's administrative boundaries using Planetiler into a unified PMTiles archive. Host this file as a static asset behind Caddy or Nginx. The web server uses HTTP Range requests to extract the exact byte offsets requested by the client's MapLibre engine, serving vector tiles at scale with minimal memory and zero database overhead.   

Dynamic Incident Overlays: Deploy Martin alongside PostgreSQL. Martin automatically discovers PostGIS spatial tables and parameterized SQL functions, compiling real-time incident reports and departmental boundaries into Mapbox Vector Tiles on the fly.   

Spatial Analytics with PostGIS: Indexing, Proximity, and Clustering

Spatial queries must execute with sub-second latency regardless of table growth. Geographic coordinates captured via mobile devices default to the World Geodetic System 1984 (EPSG:4326), which measures positions in angular degrees (longitude and latitude). Because Euclidean distance formulas cannot accurately measure distances across ellipsoidal surfaces, all metric spatial queries must either use the PostGIS geography type or transform coordinates into local projected coordinate reference systems (e.g., metric UTM zones).   

Spatial tables must be indexed using Generalized Search Trees (GiST) to build bounding-box search trees:   

SQL
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code VARCHAR(16) UNIQUE NOT NULL,
    category VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexing geometry bounding boxes via GiST
CREATE INDEX idx_incident_reports_geom ON incident_reports USING GIST (geom);

Metric Proximity Searches

When an operator investigates an incident or when an automated check evaluates nearby conditions, the database executes an index-accelerated spatial scan using ST_DWithin. Casting the geometry to geography within the query predicate allows distance thresholds to be specified directly in meters, computing accurate distances over the WGS 84 spheroid without manual projection math:   

SQL
SELECT 
    id, 
    tracking_code, 
    category, 
    status,
    ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) AS distance_meters
FROM 
    incident_reports
WHERE 
    status != 'RESOLVED'
    AND ST_DWithin(
        geom::geography, 
        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, 
        50.0
    )
ORDER BY 
    distance_meters ASC;

Incident Deduplication via ST_ClusterDBSCAN

During widespread service disruptions (such as fallen trees or localized flooding), municipal dispatchers are frequently overwhelmed by duplicate reports for the same incident. PostGIS provides density-based clustering via ST_ClusterDBSCAN.   

Unlike K-Means clustering—which requires developers to supply an arbitrary expected cluster count k—DBSCAN groups features based on physical spatial density and distance thresholds. It requires two parameters: eps (the maximum search distance) and minpoints (the minimum number of points required to form a cluster core).   

Because ST_ClusterDBSCAN operates using the Cartesian coordinates of the underlying projection, geometries must be transformed into a metric system (such as Spherical Mercator EPSG:3857 or a regional projection):   

SQL
SELECT 
    id,
    tracking_code,
    category,
    geom,
    ST_ClusterDBSCAN(
        ST_Transform(geom, 3857), 
        eps := 35.0,        -- 35-meter cluster radius
        minpoints := 2      -- Minimum 2 reports to form a duplicate cluster
    ) OVER(PARTITION BY category) AS cluster_id
FROM 
    incident_reports
WHERE 
    status IN ('SUBMITTED', 'IN_TRIAGE')
    AND created_at >= NOW() - INTERVAL '72 hours';


Rows assigned a non-null cluster_id belong to an identified spatial cluster of identical category, allowing the municipal triage system to automatically group duplicate tickets under an aggregate parent issue. Isolated incidents return a NULL cluster identifier, signaling distinct, unclustered events.   

3. Backend Architecture, Relational Modeling, and Storage Systems

The server-side layer acts as the gatekeeper for public input, enforces role-based workflows, isolates media handling, and executes geospatial lookups.

Architectural Metric	Django (GeoDjango)	FastAPI + GeoAlchemy2	NestJS + TypeORM
Primary Language	Python	Python	TypeScript (Node.js)
Spatial ORM Support	

Built-in native GIS engine (django.contrib.gis)

	External mapping via GeoAlchemy2 and Shapely	Basic spatial primitives; requires raw spatial SQL
Administrative UI	

Automatic, robust spatial admin (GISModelAdmin)

	None; must be manually developed from scratch	None; requires manual development
I/O Concurrency	Synchronous WSGI by default; supports ASGI	Asynchronous ASGI (asyncio); high concurrency	Asynchronous event loop; high concurrency
Security Surface	Integrated CSRF, ORM injection defenses, secure auth	Requires manual security middleware assembly	Enterprise module patterns; manual spatial wiring
  
Backend Framework Evaluation

GeoDjango provides an integrated spatial framework for location-based applications. It maps spatial database types directly to object-relational models and includes built-in administrative tools via django.contrib.gis.admin.GISModelAdmin. This administrative interface includes visual OpenLayers and OpenStreetMap slippy maps, allowing internal operators to review, edit, and adjust incident geometries on day one without requiring a custom dispatch frontend.   

FastAPI delivers high asynchronous throughput and low latency, but requires developers to configure database connections, spatial serialization schemas, authentication, and admin interfaces manually. NestJS offers an enterprise TypeScript architecture, but its Object-Relational Mapping libraries (TypeORM and Prisma) have limited native spatial support, frequently requiring raw SQL fallbacks for complex PostGIS queries.

For a small student team building an MVP, GeoDjango is the recommended choice. It provides built-in spatial ORM abstractions, production-tested authentication, and a functional administrative triage dashboard out of the box, allowing developers to focus on core security and business logic.   

Relational Schema Design and Database-Enforced Access Control

The database schema must isolate public submissions, support departmental ticket lifecycles, and maintain immutable audit records.

SQL
CREATE TYPE user_role AS ENUM (
    'CITIZEN',
    'MUNICIPAL_DISPATCHER',
    'DEPARTMENT_OPERATOR',
    'SYSTEM_ADMINISTRATOR'
);

CREATE TYPE issue_status AS ENUM (
    'SUBMITTED',
    'TRIAGED',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'REJECTED'
);

CREATE TABLE municipal_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    service_boundary GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'CITIZEN',
    department_id UUID REFERENCES municipal_departments(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_token VARCHAR(32) UNIQUE NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    status issue_status NOT NULL DEFAULT 'SUBMITTED',
    geom GEOMETRY(Point, 4326) NOT NULL,
    image_key VARCHAR(512),
    reporter_id UUID REFERENCES system_users(id) ON DELETE SET NULL,
    assigned_department_id UUID REFERENCES municipal_departments(id) ON DELETE SET NULL,
    assigned_operator_id UUID REFERENCES system_users(id) ON DELETE SET NULL,
    parent_duplicate_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_events (
    id BIGSERIAL PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES system_users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    state_before JSONB,
    state_after JSONB,
    ip_origin INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

Row-Level Security (RLS) Policies

To prevent authorization bypasses if an application layer vulnerability occurs, data segregation can be enforced directly within PostgreSQL using Row-Level Security (RLS):   

SQL
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Dispatchers and Admins access all municipal records
CREATE POLICY dispatcher_global_access ON reports
    FOR ALL
    TO municipal_app_user
    USING (
        CURRENT_SETTING('app.current_user_role') IN ('MUNICIPAL_DISPATCHER', 'SYSTEM_ADMINISTRATOR')
    );

-- Field Operators can only access tickets assigned to their department
CREATE POLICY operator_department_isolation ON reports
    FOR ALL
    TO municipal_app_user
    USING (
        CURRENT_SETTING('app.current_user_role') = 'DEPARTMENT_OPERATOR'
        AND assigned_department_id = NULLIF(CURRENT_SETTING('app.current_user_dept'), '')::UUID
    );

-- The public and citizens can only read active non-sensitive ticket states
CREATE POLICY public_status_read ON reports
    FOR SELECT
    TO municipal_app_user
    USING (TRUE);

Media Storage Architecture: Object Storage vs. Filesystem

Storing user-uploaded media files directly on the application server's local filesystem introduces severe architectural and security risks. It ties binary storage to a single server instance, preventing horizontal container scaling. Additionally, serving files directly from the host filesystem creates potential directory traversal vulnerabilities and risks local disk saturation that can crash the host operating system.

Evaluation Dimension	Dedicated POSIX Filesystem	S3-Compatible Object Storage (SeaweedFS)
System Decoupling	Compute nodes and physical disk storage are tightly coupled	

Compute nodes are stateless; storage scales horizontally


Direct Upload Offloading	None; all media bytes must stream through backend application processes	Enabled via expiring S3 Presigned PUT operations
Resource Isolation	Upload spikes consume backend web worker threads and memory	

Media streaming is handled by the object storage gateway


Licensing Considerations	Native operating system POSIX layer; unencumbered	

Apache-2.0 permissive open-source license

  
The MinIO Licensing Risk and the Choice of SeaweedFS

MinIO has historically been a popular self-hosted S3-compatible object storage solution. However, MinIO is licensed under the GNU Affero General Public License v3 (AGPLv3). In municipal and public sector environments, AGPLv3 introduces legal and compliance concerns: its network-copyleft provisions can require organizations that modify or integrate the software across network boundaries to disclose the source code of surrounding systems.   

SeaweedFS provides a high-performance alternative licensed under the permissive Apache License 2.0. Modeled on Facebook's Haystack design, SeaweedFS is optimized for billions of small-to-medium files. It avoids per-file inode exhaustion by appending blobs into shared volume files, keeping lookups to an O(1) disk seek. SeaweedFS provides a complete S3-compatible gateway, can be deployed as a single binary (weed mini) during early development, and integrates with standard AWS S3 SDKs across all backend languages.   

The Presigned Ingestion Protocol

To prevent high-volume image uploads from consuming application server memory and thread pools, the backend should not accept direct file uploads. Instead, it coordinates uploads using presigned URLs:

The client requests an upload authorization slot from the API backend.

The backend verifies the user's rate limits and generates a short-lived (e.g., 180 seconds), cryptographically signed S3 Presigned URL scoped to an isolated quarantine bucket in SeaweedFS.

The client uploads the image binary directly to the object storage gateway via an HTTP PUT request.

The client submits the report metadata along with the uploaded object key to the API backend.

The backend confirms the object exists in quarantine and queues an asynchronous sanitation task before publishing the image.

4. Security-Relevant Architecture and Defensive Engineering

Exposing an unauthenticated or public-facing media ingestion endpoint creates significant attack surface. Systems must defend against malicious file uploads, metadata leakage, denial-of-service attempts, and automated spam, while maintaining a tamper-resistant audit trail.

Ingestion Sanitation and the Server-Side Metadata Pipeline

Image files submitted from citizen smartphones contain extensive Exchangeable Image File Format (EXIF), IPTC, and XMP metadata blocks. This metadata often includes precise home location coordinates, camera sensor serial numbers, device model details, and timestamps. If uploaded images are published without sanitization, malicious actors can harvest this data to dox anonymous whistleblowers or cross-reference private citizen habits.

While client-side canvas redrawing can strip metadata within the browser, relying exclusively on client-side sanitization is fundamentally insecure. Attackers can easily bypass browser logic and transmit crafted payloads directly to the upload API. Consequently, all image sanitization must be enforced server-side within a sandboxed worker pipeline.

The backend sanitation pipeline must extract the GNSS coordinates from the EXIF payload, convert them into a verified PostGIS point geometry, and completely strip all metadata blocks from the file binary.   

Using Python's standard Pillow library for image sanitization can be risky under high load. Pillow decompresses incoming files entirely into system memory. A single 48-megapixel image captured by a modern smartphone decompresses into an uncompressed raster bitmap consuming 150 MB to 200 MB of RAM. A burst of concurrent uploads can trigger memory exhaustion, leading to Out-Of-Memory (OOM) crashes and Denial-of-Service conditions.

libvips (accessed via pyvips in Python or sharp in Node.js) avoids this through a horizontal scanline streaming architecture. It streams pixels through a processing pipeline without holding the uncompressed image in RAM, reducing memory consumption by 70% to 80% compared to Pillow while running four to five times faster:   

Python
import pyvips

def sanitize_and_transcode_media(raw_bytes: bytes) -> bytes:
    """
    Strips all metadata blocks from incoming image bytes and transcodes
    the image to WebP format to prevent polyglot payload execution.
    """
    # Stream the image from memory buffer without full decompression
    image = pyvips.Image.new_from_buffer(raw_bytes, "")
    
    # Enumerate and strip all tracking metadata blocks
    for field in image.get_fields():
        if field.startswith(("exif-", "iptc-", "xmp-", "icc-")):
            image.remove(field)
            
    # Transcode to WebP format with all metadata explicitly stripped
    sanitized_bytes = image.write_to_buffer(".webp[Q=80,strip=true]")
    return sanitized_bytes

Media Isolation, Malware Scanning, and Neutralization

Accepting binary uploads exposes the platform to polyglot files (e.g., combining executable PHP or shell scripts within valid image headers), decompression bombs, and embedded exploit payloads targeting parsing libraries.

The upload pipeline enforces defense-in-depth across multiple stages:

Magic Byte Validation: The worker reads the first 512 bytes of the uploaded file using libmagic to verify its actual MIME type. It rejects disguised binaries, shell scripts, and Scalable Vector Graphics (SVG) formats, which present XML External Entity (XXE) and Cross-Site Scripting (XSS) risks.

Sandboxed Antivirus Scanning: Newly uploaded files land in an access-restricted S3 quarantine bucket. An asynchronous worker streams the file through an isolated ClamAV daemon container (clamdscan) over a Unix socket or local network interface. If malicious signatures are detected, the object is immediately purged from quarantine, and the incident report is flagged for administrative review.

Binary Neutralization via Transcoding: Once cleared by ClamAV, the image is transcoded into a standardized, web-optimized format (such as WebP) using libvips. This step destroys trailing code injection vectors, strips unrecognized metadata blocks, and neutralizes polyglot payloads by re-rasterizing the pixel matrix. The finalized image is assigned a random UUID identifier and transferred to the public media bucket.   

Rate Limiting and Privacy-Preserving Bot Defenses

Public-facing municipal endpoints require protection against automated request flooding, ticket spam, and resource exhaustion attacks.

Rate limiting should be enforced across two architectural layers:

Edge Reverse Proxy: The external ingress proxy (e.g., Caddy or Nginx) enforces global leaky-bucket rate limits per client IP address. Public reporting routes are capped at sensible rates (e.g., 10 requests per minute per /24 IPv4 block or /48 IPv6 prefix).

Application and Storage Limits: The API backend enforces token-bucket limits in Redis, restricting how frequently an individual client can request presigned upload tokens and submit completed reports.

Bot Challenge Engine	Underlying Mechanism	Data Privacy & GDPR Status	Software License	Operational Architecture
ALTCHA	

Cryptographic Proof-of-Work (PoW)

	

100% GDPR compliant; zero cookies or user tracking

	

MIT License

	

Self-hosted verification via backend HMAC secrets


mCaptcha	

Dynamic Proof-of-Work difficulty scaling

	

Privacy-preserving; zero tracking cookies

	

AGPL-3.0 License

	

Self-hosted Rust server daemon


Cloudflare Turnstile	Behavioral analysis and browser risk scoring	External vendor telemetry processing	Proprietary SaaS	Hosted third-party cloud infrastructure
  

Commercial anti-bot systems like Google reCAPTCHA track user behavioral telemetry across domains, creating GDPR compliance challenges for public sector deployments.   

ALTCHA provides a fully open-source, privacy-preserving alternative. It uses a cryptographic Proof-of-Work (PoW) challenge: when a citizen submits a report, the browser's background Web Worker computes the solution to a lightweight cryptographic puzzle.   

The resulting proof payload is validated on the backend in constant time using an HMAC secret. This prevents automated scripts from spamming submission endpoints, complies with WCAG 2.2 accessibility standards by eliminating visual puzzles, and processes all validation data locally without external third-party requests.   

Immutable Audit Trails and Hardened Transport Defaults

Municipal dispatch platforms handle sensitive data regarding municipal liabilities, code violations, and public safety issues. Maintaining an auditable, tamper-resistant history of all ticket modifications is critical for institutional accountability.

To ensure audit log integrity, database triggers prevent records in the audit_events table from being updated or deleted, even by privileged application users:

SQL
CREATE OR REPLACE FUNCTION seal_audit_record()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log entries are cryptographically sealed and cannot be mutated.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_seal_audit_history
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION seal_audit_record();


The edge proxy enforces defensive HTTP security headers across all client responses:

HTTP
Content-Security-Policy: default-src 'self'; img-src 'self' blob: data: https://tiles.internal.gov; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://tiles.internal.gov; frame-ancestors 'none';
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(self), microphone=()

5. Staff Dashboard and Real-Time Communication Architecture

Municipal dispatchers manage incoming incident queues throughout the working day. As new reports are submitted, the triage map must display updated markers, priority flags, and status changes in real time without requiring manual page reloads.

Communication Mechanism	Operational Complexity	Network Protocol & Topology	Browser Reconnection Semantics	Failure Profile
Short Polling	Minimal; periodic HTTP requests	Standard HTTP/1.1 or HTTP/2	Stateless; handles reconnections natively	High database load from continuous polling queries
Server-Sent Events (SSE)	Low; unidirectional HTTP stream	Persistent HTTP/2 connection	Native automatic reconnect with Last-Event-ID	Simple failover; relies on standard HTTP proxies
WebSockets	High; bidirectional TCP framing	Stateful protocol switch (ws:///wss://)	Manual heartbeat tracking and reconnection logic	Complex; requires sticky sessions and Redis adapters
Transport Protocol Selection: Server-Sent Events

While WebSockets are often chosen for real-time web applications, they introduce unnecessary operational complexity for municipal dispatch systems. The communication model in a triage dashboard is almost entirely unidirectional: the server broadcasts status updates, spatial cluster changes, and new incident tickets to connected operator clients.

WebSockets require managing persistent, stateful TCP connections. Scaling WebSocket backends horizontally requires message brokers (such as Redis Pub/Sub) and specialized clustering layers to sync state across nodes. Furthermore, intermediate corporate proxies and municipal firewalls frequently terminate idle WebSocket connections, requiring custom client-side heartbeat and reconnection logic.

Server-Sent Events (SSE) offer a simpler, more robust alternative for this workflow:

Native Transport Resilience: SSE operates over standard HTTP/2, multiplexing multiple event streams over a single TCP connection alongside routine web traffic. The browser's native EventSource API handles connection health monitoring and exponential backoff reconnections automatically.

Built-in Message Resynchronization: Every SSE packet can include an incremental id: field. If network connectivity drops, the browser automatically transmits a Last-Event-ID header when reconnecting. The backend reads this header and replays any events missed during the disconnected window from an ephemeral cache or Redis buffer.

Proxy Compatibility: SSE appears as standard HTTP streaming traffic to reverse proxies and application firewalls, avoiding the custom upgrade headers and timeout configurations required by WebSockets.

Non-Disruptive Map State Synchronization

When an SSE event reaches the municipal dashboard, updating the user interface must not disrupt the operator's active workflow. Naive patterns that trigger full-page reloads or remount the map component wipe out current pan, zoom, and selection states, hindering operator efficiency.

To maintain a fluid interface, the dashboard separates state updates between tabular ticket lists and the mapping engine. Application state caches (managed via libraries like TanStack Query) apply updates directly to specific ticket records in memory.

To update the map without visual flicker, the application pushes new spatial features directly to MapLibre's vector runtime using map.getSource('active_incidents').setData(updatedGeoJsonCollection). MapLibre GL JS dynamically recalculates point clusters and updates GPU-rendered markers in place, preserving current camera angles, zoom levels, and active inspection popups.   

6. Containerized Deployment and Infrastructure Sovereignty

Public sector platforms require reproducible, secure deployment pipelines that enforce data residency mandates and isolate critical services.

National Cloud Standards: Republic of Moldova MCloud

In the Republic of Moldova, public sector hosting architectures are governed by Government Decision No. 128 of February 20, 2014, on the Common Governmental Technological Platform (MCloud) (Hotărârea Guvernului nr. 128/2014 privind platforma tehnologică guvernamentală comună (MCloud)). The technological operation of MCloud is administered by the Information Technology and Cyber Security Service (Serviciul Tehnologia Informației și Securitate Cibernetică - STISC).   

MCloud delivers sovereign Infrastructure-as-a-Service (IaaS), providing virtualized computing nodes, private network segments, and internal security monitoring within centralized state data centers. Deploying on MCloud involves provisioning enterprise Linux virtual machines (such as AlmaLinux, Rocky Linux, or Ubuntu LTS) within STISC-managed networks. All stored citizen data, database records, and captured imagery must remain within this infrastructure to comply with national data sovereignty regulations.   

Container Orchestration: Docker Compose vs. Lightweight Kubernetes
Orchestration Metric	Docker Compose	Lightweight Kubernetes (K3s)
Control Plane Overhead	Negligible; minimal daemon memory (<50 MB RAM)	Moderate; control plane requires 500 MB to 1.5 GB RAM
Operational Learning Curve	Low; single declarative configuration file (compose.yml)	Steep; requires managing Helm charts, CRDs, and ingresses
Storage & Volume Simplicity	Direct local POSIX binds and managed volume drivers	Complex; requires dynamic Persistent Volume Claims and CSI drivers
Multi-Node Failover	None natively; tied to single virtual machine instance	Automated multi-node pod scheduling and self-healing
Team Fit for an MVP	Ideal for small student teams with limited DevOps overhead	Over-engineered for small teams; introduces operational complexity

For a student team delivering a municipal MVP, running Docker Compose on a single provisioned MCloud virtual machine (or a dedicated municipal server) is the most reliable operational approach. It provides comprehensive service isolation and reproducible setups without the operational complexity, configuration overhead, and control-plane maintenance required by Kubernetes.

Production-Grade Containerized Service Topology

The complete application stack runs as an isolated container topology configured via Docker Compose:

YAML
version: '3.8'

services:
  # Edge Reverse Proxy and Automatic TLS Termination
  caddy:
    image: caddy:2.7-alpine
    container_name: proxy_caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - backend
      - martin
      - seaweedfs

  # Spatial Relational Database
  postgis:
    image: postgis/postgis:16-3.4-alpine
    container_name: db_postgis
    restart: unless-stopped
    environment:
      POSTGRES_DB: municipal_db
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgis_data:/var/lib/postgresql/data
      - ./infra/postgres/init:/docker-entrypoint-initdb.d:ro
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'

  # Dynamic Vector Tile Engine
  martin:
    image: ghcr.io/maplibre/martin:v0.11.6
    container_name: tile_martin
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgis:5432/municipal_db
    depends_on:
      - postgis
    deploy:
      resources:
        limits:
          memory: 512M

  # Core Application Backend (GeoDjango)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: app_backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgis://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgis:5432/municipal_db
      REDIS_URL: redis://redis:6379/0
      S3_ENDPOINT: http://seaweedfs:8333
      S3_ACCESS_KEY: ${S3_ACCESS_KEY}
      S3_SECRET_KEY: ${S3_SECRET_KEY}
      ALTCHA_HMAC_SECRET: ${ALTCHA_HMAC_SECRET}
    depends_on:
      - postgis
      - redis
      - seaweedfs

  # Asynchronous Background Media Sanitizer
  media_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.worker
    container_name: app_media_worker
    restart: unless-stopped
    environment:
      REDIS_URL: redis://redis:6379/0
      CLAMAV_HOST: clamav
      S3_ENDPOINT: http://seaweedfs:8333
    depends_on:
      - redis
      - clamav
      - seaweedfs
    deploy:
      resources:
        limits:
          memory: 2G

  # Sandboxed Malware Inspection Engine
  clamav:
    image: clamav/clamav:latest
    container_name: scanner_clamav
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'

  # Sovereign S3-Compatible Object Storage
  seaweedfs:
    image: chrislusf/seaweedfs:latest
    container_name: storage_seaweedfs
    restart: unless-stopped
    command: "server -s3 -dir=/data"
    volumes:
      - seaweedfs_data:/data
    deploy:
      resources:
        limits:
          memory: 1G

  # Real-Time Event Broker and Rate Limiting Cache
  redis:
    image: redis:7-alpine
    container_name: broker_redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          memory: 512M

volumes:
  caddy_data:
  caddy_config:
  postgis_data:
  seaweedfs_data:
  redis_data:

Memory Management and Out-of-Memory Defenses

Running multiple containerized services within a virtual machine with bounded memory requires explicit resource constraints to prevent the Linux kernel's Out-Of-Memory (OOM) killer from terminating critical processes.

ClamAV requires approximately 1.2 GB of RAM simply to load its active virus signature database into memory. If ClamAV experiences an unexpected memory spike during parallel file scanning, an unconstrained system might terminate the PostgreSQL container to free memory.

To ensure system stability under high load:

Container Memory Ceilings: Every service in the Docker Compose topology is assigned an explicit memory limit (deploy.resources.limits.memory).

PostgreSQL OOM Prioritization: On the host system, configure the kernel oom_score_adj for the PostgreSQL container to -900. This prioritizes auxiliary workers and scanning sidecars for termination during extreme memory pressure, protecting the core database from sudden crashes.

Encrypted Host Swap: Allocate an encrypted 4 GB to 8 GB swapfile on the host solid-state drive (SSD). While swapping decreases image processing speeds during transient traffic surges, it prevents process crashes and keeps ingestion pipelines operational.

Database Backups and Disaster Recovery

A municipal incident platform requires automated backup workflows to protect operational records:

Logical Database Dumps: An automated cron task executes pg_dump -Fc on the PostGIS container every night. The resulting custom-format archive is compressed and allows point-in-time recovery down to specific tables or spatial schemas.

Object Storage Snapshots: SeaweedFS object volumes should be backed up periodically using automated volume mirroring (weed backup) to an offsite location or a secondary municipal storage server.

Automated Recovery Testing: Backup systems should run monthly automated recovery tests. A scheduled script boots an isolated, ephemeral PostGIS container, restores the latest backup dump, and executes spatial verification queries (e.g., SELECT count(*) FROM reports WHERE ST_IsValid(geom);) to confirm backup integrity.

7. Comprehensive Open-Source Stack and License Synthesis

The selected technologies provide a fully open-source, sovereign software stack. Each component has been chosen to minimize operational complexity, avoid copyleft licensing conflicts, and provide strong baseline security guarantees.

Architectural Layer	Recommended Solution	Software License	Integration Role	Security & Operational Tradeoffs
Citizen Client	React / Vue PWA via Vite	MIT License	

Mobile-first public intake interface

	

High user reach with zero installation barriers; requires graceful handling for iOS WebKit Background Sync limits


Triage Dashboard	MapLibre GL JS	

BSD-3-Clause

	

High-density interactive staff dispatch map

	

GPU-accelerated vector rendering; requires WebGL support on client devices


Spatial Database	PostgreSQL 16 + PostGIS 3.4	PostgreSQL License / GNU GPLv2	

Spatial relational persistence engine

	

Robust spatial analytics; requires careful memory tuning and Row-Level Security configuration


Tile Engine	Martin	

Dual Apache-2.0 / MIT

	

On-the-fly MVT vector tile generation

	

Fast Rust binary; should be deployed behind an HTTP cache to buffer repetitive queries


Core API Backend	Django 5.x + GeoDjango	

BSD-3-Clause

	

Core business logic, auth, and triage admin

	

Speeds up MVP development via auto-generated spatial admin; high-throughput uploads should be offloaded to workers


Object Storage	SeaweedFS	

Apache-2.0

	

S3-compatible media storage

	

Permissive license avoids AGPL copyleft issues; requires strict presigned URL expirations


Media Sanitization	libvips (pyvips)	LGPL-2.1+	

Metadata stripping and image transcoding

	

Streaming architecture prevents memory exhaustion; strips EXIF tracking metadata


Malware Inspection	ClamAV Daemon	GNU GPLv2	Binary payload and antivirus inspection	Scans untrusted uploads in sandbox; requires a dedicated 2 GB memory allocation
Bot Protection	ALTCHA	

MIT License

	

Cryptographic Proof-of-Work challenge

	

Blocks automated submission spam without cookies or user tracking; verified locally via HMAC


Edge Proxy	Caddy 2	Apache-2.0	TLS termination and reverse proxying	Automated certificate management; requires centralized configuration for port 80/443 ingress
  
8. Strategic Conclusion and Implementation Roadmap

Deploying a sovereign, secure citizen reporting platform requires thoughtful system decoupling and defensive engineering at every layer. By steering clear of proprietary mapping services and commercial storage clouds, municipalities can prevent unpredictable vendor lock-in, protect citizen privacy, and maintain full control over their operational data.

For an engineering team building an MVP, three architectural priorities ensure project success:

Minimize Citizen Friction: Build the intake interface as a Progressive Web App utilizing standard declarative <input capture="environment"> camera triggers. This avoids app store friction and provides immediate access across both Android and iOS devices.

Ingestion Defense-in-Depth: Decouple user media uploads from core database transactions. Route images through short-lived presigned URLs directly into an isolated SeaweedFS quarantine bucket, sanitize files asynchronously using libvips and ClamAV, and protect submission routes using self-hosted ALTCHA proof-of-work verification.   

Core Simplicity: Deploy the foundational platform using GeoDjango, PostGIS, Martin, and MapLibre GL JS orchestrated via a single Docker Compose topology. This configuration provides an immediate operational triage system with built-in spatial admin tools, capable of running smoothly on local municipal hardware or within the Republic of Moldova's MCloud hosting infrastructure.
