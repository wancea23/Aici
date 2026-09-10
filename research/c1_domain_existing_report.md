# c1 - domain & existing civic-reporting systems (global + MD/RO)

> Source: https://share.gemini.google/tJIbVoeMlpmp
> Harvested 2026-09-10 (project: Aici).

---

Architectural and Operational Analysis of Civic Issue-Reporting Systems: Global Paradigms, Regional Realities in Moldova and Romania, and Legal Frameworks for Municipal Deployment
Global Landscapes and Operational Architectures of Civic Issue-Reporting Systems

Civic issue-reporting platforms, conventionally structured as digital non-emergency municipal service platforms or "311" engines, mediate the interaction between municipal administrations and urban residents. These systems convert residents from passive observers into distributed data collectors who pinpoint localized infrastructural failures, such as road degradation, public lighting outages, illegal waste accumulation, and damaged street furniture. Rather than serving as isolated web intake forms, established civic platforms operate as bi-directional routing engines that integrate public-facing client applications directly with back-office municipal Enterprise Asset Management (EAM), Customer Relationship Management (CRM), and field dispatch databases.   

Across international deployments, civic technology has converged around several primary architectural models. These models are reflected in the United Kingdom's FixMyStreet platform, developed by the non-profit mySociety and deployed for local authorities through SocietyWorks; the municipal 311 systems of North America, including the commercial SaaS platform SeeClickFix and open data ecosystems built on the Open311 standard; and Germany's state-backed regional administrative model, exemplified by Brandenburg's Maerker.   

Architectural Dimension	FixMyStreet / FixMyStreet Pro (UK)	SeeClickFix / Open311 Ecosystem (US)	Maerker Brandenburg (Germany)
Primary System Architecture	

Open-source core with a commercial Progressive Web App (PWA) software-as-a-service enterprise tier.

	

Multi-tenant SaaS platform backed by native mobile clients, web portals, and public REST APIs.

	

Centralized regional portal (service.brandenburg.de) managed by the state IT service provider ZIT-BB.


Interoperability Standards	

Native Open311 server and client endpoints; custom JSON/XML REST connectors.

	

Open311 GeoReport v2 API compliance; proprietary endpoints for municipal integrations.

	

Proprietary internal interfaces managed through the Brandenburg Municipal Application Center (KAZ).


Triage and Routing Engine	

Automated spatial polygon clipping matching administrative council, county, and highway boundaries.

	

Automated geospatial and category routing directly into municipal field-work management databases.

	

Centralized manual editorial moderation (Maerker-Redaktion) prior to departmental dispatch.


Back-Office Enterprise Integration	

Automated two-way data synchronization with Confirm, Symology Insight, Verint, and Exor.

	Deep API synchronization with Cityworks, Salesforce Service Cloud, Lucity, and Cartegraph.	

Web-based administrative console or municipal ticket system integration.


Transparency and Public Tracking	

Open-by-default public map feed, public discussion threads, and duplicate subscription prompts.

	Public geographical feed, community upvoting mechanisms, and public administrative responses.	

Public map using a standardized four-state traffic light (Ampel) status model.


Operational Service-Level Agreement (SLA)	

Defined locally by contracting councils and service contract specifications.

	Defined by departmental performance charters and internal municipal agency targets.	

Mandatory institutional Serviceversprechen: formal status publication within 3 business days.

  

The end-to-end incident lifecycle across these platforms follows an integrated five-stage trajectory: ingestion, triage, inter-departmental routing, resolution execution, and citizen notification.   

The ingestion phase captures urban defects via photo-first or map-first client workflows. Modern platforms prioritize image capture, extracting Exchangeable Image File Format (EXIF) metadata to automatically isolate device coordinates and timestamps, falling back to network-based geolocation or manual street-level geocoding if metadata has been stripped.   

During the triage phase, raw submissions are validated against geographical polygons and taxonomies. FixMyStreet executes automated spatial clipping in PostGIS, comparing coordinates against multi-tiered local authority boundaries. In contrast, Germany's Maerker routes incoming tickets through a human editorial desk (Maerker-Redaktion). Editorial gatekeepers screen submissions for defamatory language, remove personally identifiable information—such as visible faces or vehicle license plates—in compliance with data protection laws, and verify municipal jurisdiction before publishing the report to the shared map.   

The inter-departmental routing phase directs validated tickets to the appropriate administrative entities. In multi-tiered governance structures, such as British administrative tiers where carriageway management is separated from residential pavement upkeep, FixMyStreet automatically routes reports among district councils, county councils, National Highways, and social housing trusts. In systems utilizing the Open311 GeoReport v2 standard, reports are passed directly to external endpoints via standard XML or JSON payloads containing category IDs, lat-long coordinates, addresses, and media URLs.   

The resolution execution phase occurs within departmental Enterprise Asset Management (EAM) suites. In municipalities like Oxfordshire and Dudley, incoming civic tickets generate discrete work orders inside platforms such as Symology Insight or Confirm without administrative re-keying. Highway inspectors receive pre-populated dimension fields, priority ratings, and asset identifiers, allowing field crews to locate assets, execute repairs, and log materials directly from in-vehicle terminals.   

The citizen notification phase closes the operational feedback loop. When a work order is updated or signed off in the back-office EAM, status transitions propagate back to the reporting platform via webhooks or polling APIs, sending automated notifications to the reporting resident and subscribed neighbors.   

Maerker formalizes this status lifecycle through a standardized four-tier traffic light (Ampel) system:   

Red (Eingetragen): The report is registered in the municipal intake database but awaits departmental site inspection and technical verification.   

Yellow (In Arbeit): The responsible technical department (Fachverwaltung) has confirmed jurisdiction, initiated an engineering assessment, or scheduled physical remediation.   

Green (Erledigt): Physical repairs are complete, the site has passed inspection, and the ticket is formally closed.   

Yellow/Green (Abschließend bearbeitet): The municipality cannot physically resolve the issue directly—due to private property boundaries, lack of capital budget, or jurisdictional coverage by an external utility—and the ticket has been forwarded to third parties or deferred to future capital planning.   

Comparative State of Civic Reporting in Moldova and Romania

In the Republic of Moldova and Romania, municipal digital channels coexist alongside legacy post-communist administrative procedures. While both nations have introduced municipal reporting portals and mobile applications, these tools often encounter friction when bridging lightweight digital reporting with formal administrative law.   

The Institutional Landscape in Chișinău and the Republic of Moldova

The central municipal reporting platform in Moldova is eu.chisinau.md, developed as a collaborative initiative between the Chișinău City Hall (Primăria Municipiului Chișinău) and the IT company Simpals. The platform launched in an initial testing phase in December 2019 and was formalized under the municipal regulation Regulamentul cu privire la examinarea sesizărilor electronice publicate pe portalul și aplicația mobilă EU.CHISINAU.   

Between its launch in late 2019 and August 2021, eu.chisinau.md logged more than 8,000 incident reports, and municipal departments processed 1,505 public submissions during the first semester of 2022 alone. The platform structures urban incident management across nine municipal modules, routing submissions directly to specialized municipal subdivisions and municipal enterprises (Întreprinderi Municipale).   

Operational Category	Assigned Municipal Directorate or Enterprise	Core Operational Remit
Waste Platforms (Platforme de deșeuri)	

Î.M. Regia "Autosalubritate" / DGLCA

	

Removal of overflowing municipal waste, repair of container infrastructure, and clearance of illegal dumps.


Urban Sanitation (Salubrizare)	

Preturile de sector (Botanica, Buiucani, Centru, Ciocana, Râșcani) / DGLCA

	

Street sweeping, leaf collection, clean-up of public spaces and non-contracted areas.


Sewerage and Water Outages (Guri de canalizare / spargeri)	

S.A. "Apă-Canal Chișinău"

	

Repair of broken potable water mains, localized sewer network backups, and replacing missing storm drain grates.


Roads, Potholes, and Signage (Drumuri, gropi și semne)	

Î.M. Regia "Exdrupo" / General Directorate of Urban Mobility

	

Pothole patching, structural carriageway repairs, curb alignment, and traffic sign restoration.


Lighting and Signals (Iluminare și semafoare)	

Î.M. "Lumteh"

	

Repair of street lighting networks, aerial power line connections, and traffic signal controller synchronization.


Parks and Green Spaces (Parcuri și spații verzi)	

Î.M. "Asociația de gospodărire a spațiilor verzi"

	

Tree felling and pruning, clearing fallen limbs, maintaining public parks, and lawn care.


Stray Animal Management (Maidanezi)	

Î.M. Regia "Autosalubritate" / Animal Control Section

	

Capture, veterinary sterilization, census monitoring, and municipal shelter transport for stray canines.


Unauthorized Construction (Construcții neautorizate)	

Preturile de sector / Building Inspection Sections

	

Documenting unauthorized annexes, fences, non-compliant attic conversions, and investigating building permits.


Unauthorized Commerce (Comerț neautorizat)	

Preturile de sector / Municipal Police Assistance Sections

	

Removal of unlicensed kiosks and eviction of informal roadside and sidewalk vendors.

  

The internal workflow of eu.chisinau.md processes tickets through four administrative statuses: Respins (rejected due to regulatory non-compliance, defamatory language, or non-municipal jurisdiction), În lucru (under review and field inspection by the designated department), Amânat (deferred due to technical or budgetary limitations and scheduled for subsequent fiscal budget cycles), and Soluționat (completed).   

Authentication on eu.chisinau.md is asymmetric: citizens authenticate via consumer social logins (Google, Facebook, Odnoklassniki, Yandex), whereas municipal editors, coordinators, and verification officers must use the national digital identity gateway MPass.   

Beyond eu.chisinau.md, national e-government portals in Moldova serve distinct public administrative functions rather than localized incident reporting. The national catalog servicii.gov.md functions as an index for state public services, directing citizens to transactional e-services such as cadastral excerpts, civil status records, and commercial licensing. The platform particip.gov.md acts as the central repository for public policy consultations, hosting draft primary and secondary legislation from government ministries to collect stakeholder feedback.

Because localized civic reporting tools are often poorly understood outside municipal centers, Moldovan citizens rely on several alternative reporting mechanisms:

The Central Municipal Dispatch and Green Lines (Linia Verde): Chișinău operates a 24/7 central municipal telephone dispatch (Dispeceratul Central Municipal at 022-22-22-67) alongside direct hotlines managed by individual Preturi (borough administrations) and technical enterprises like S.A. Apă-Canal and Lumteh.   

Social Media Escalation: Citizens regularly post infrastructure complaints on Facebook civic discussion groups (such as "Chisinau Fail" and neighborhood associations) or directly tag the General Mayor (Primar General) and borough deputy mayors (Pretori), prompting municipal press officers to manually convert public visibility into internal work directives.

Formal Written Petitions: Citizens submit physical, signed petitions in paper format to the chancellery registries of local city halls, or send scanned files via institutional email addresses.   

Civic Incident Reporting in Romania

Romania’s civic reporting landscape has transitioned from independent, non-governmental civic tech software to dedicated, municipally integrated incident management platforms.   

During the 2015–2017 period, independent initiatives such as Civic Alert, founded by Adrian Stănescu, sought to digitize citizen complaints. Within its first three months of operation, Civic Alert logged 11,000 incident reports across Bucharest and other urban areas, focusing on road damage, broken street lamps, and illegal waste dumping.   

Civic Alert served as an administrative proxy: it collected incident coordinates and photographs from citizens, converted them into formal legal complaints, and emailed them to the relevant local authorities under Romania’s public petitioning framework (Ordonanța Guvernului nr. 27/2002). The application served as a foundational civic module within the 2016–2017 "Alba Iulia Smart City" pilot project, where local authorities directly ingested citizen alerts into their municipal dashboards. However, the absence of sustained municipal SaaS procurement models made long-term operational maintenance difficult for external volunteer-driven applications.   

In subsequent years, Romanian municipalities shifted toward in-house and commercially procured enterprise civic reporting applications. The MyCluj platform, implemented by the Cluj-Napoca Municipality, represents the most widely cited benchmark in the country. MyCluj allows authenticated residents to drop pins on a municipal map across specific operational categories, automatically dispatching tickets to departments such as the Public Domain Directorate (Direcția Administrare Patrimoniu și Evidența Proprietății) and the Local Police (Poliția Locală). Parallel custom incident applications have been implemented across Bucharest’s sector administrations (such as Sector 4 and Sector 6) and other primary municipalities (including Brașov, Oradea, and Sibiu).   

Empirical Dynamics of Adoption, Operational Friction, and Failure Modes

Civic technology research and operational reviews demonstrate that software development accounts for only a minor fraction of a civic reporting system's lifecycle; the primary challenges lie in back-office business process re-engineering and sustained municipal engagement. When platforms fail, they typically do so because of organizational bottlenecks, asymmetric incentives, and communication breakdowns.   

Failure Mode	Operational Manifestation	Root Cause	Systemic and Architectural Countermeasure
The "Administrative Black Hole"	

Ticket statuses remain indefinitely "Pending" or "In Review"; citizen submissions drop sharply after an initial launch surge.

	

The application is treated as an isolated PR channel disconnected from field-work queues, with no formal operational SLAs or budget allocations.

	

Direct bi-directional API integration into existing enterprise work-order engines; executive or statutory response charters (e.g., Maerker 3-day SLA).


The "Empty Map" Cold-Start Deficit	New users download the application, view an empty neighborhood map, assume the platform is abandoned, and uninstall it.	

The platform launches with an empty spatial database instead of surfacing ongoing capital works, utility cuts, or historical remediations.

	

Seed public map layers at launch with active municipal capital works, road repairs, tree pruning campaigns, and utility permits.


Duplicate Storms and Triage Paralysis	

High-visibility issues (e.g., an arterial water main burst) generate hundreds of identical tickets, overwhelming triage staff.

	

The front-end ingests each user input as an isolated database entry without checking spatial proximity or semantic overlaps at submission time.

	

Real-time spatial buffer querying and natural language processing; prompting users to subscribe to an existing pin rather than log a new ticket.


Citizen Fatigue from Administrative Drag	

Initial civic engagement drops over 3 to 6 months; reporting shifts to a small group of hyper-local power users.

	

Users invest time documenting urban defects but receive delayed, opaque rejections or generic status updates without explanation.

	

Granular interim statuses (e.g., Maerker yellow/green state); automated push notifications explaining jurisdictional and financial context.


Socio-Spatial Participation Bias	

Municipal resources are disproportionately deployed to affluent neighborhoods reporting minor aesthetic issues.

	

Digital divide barriers, lower institutional trust, and digital literacy hurdles reduce reporting in disadvantaged areas.

	

Balance 311 intake volume with proactive physical municipal surveys and mobile sensing vehicles across underserved zones.

  

The administrative black hole represents the most common cause of abandonment in civic technology. When a municipality launches an issue-reporting app without integrating it into the daily operations of its field departments, citizen submissions become an unmanaged backlog. This dynamic triggers a failure demand loop: when an initial report receives no meaningful response, citizens resubmit the ticket multiple times, telephone municipal dispatchers, and post grievances on social media, increasing the administrative burden across all channels.   

Duplicate reporting creates operational gridlock during severe weather events or infrastructure failures. When a water main bursts on a major roadway, dozens of commuters may submit identical tickets within minutes. Without client-side deduplication, municipal intake teams spend hours manually consolidating identical tickets. To resolve this, FixMyStreet integrates proactive map clustering: when a user positions their pin near an existing report in the same category, the interface highlights the active ticket and prompts the user to subscribe for resolution updates instead of submitting a new report.   

Empirical evaluations also highlight systemic socio-spatial biases within 311 reporting datasets. Studies of municipal 311 usage demonstrate that complaint frequency often correlates with homeownership, educational levels, and neighborhood wealth rather than the objective physical distribution of infrastructure failures. Affluent communities frequently generate tickets for minor cosmetic flaws, such as overgrown private hedges or street parking compliance, while lower-income neighborhoods may under-report severe physical hazards due to lower expectations of government action. If a municipal dashboard prioritizes resources based solely on raw ticket volume, it risks compounding historical under-investment in vulnerable areas. Municipalities must therefore blend incoming citizen reports with structured, inspector-led audits to allocate capital resources equitably.   

The Legal Architecture of Citizen Petitioning in the Republic of Moldova

When deploying an urban incident reporting platform in the Republic of Moldova, software workflows must align with national administrative law. Citizen grievances, requests, and infrastructure notices are governed by the Administrative Code of the Republic of Moldova nr. 116/2018 (Codul administrativ al Republicii Moldova nr. 116/2018), which unified public administrative procedures and repealed the earlier Law on Petitioning nr. 190/1994.   

Legal Taxonomy of Citizen Petitions

Article 9 of the Administrative Code defines a petition (petiția) as any request (cerere), notification (sesizare), or proposal (propunere) addressed to a public authority by a natural or legal person.   

Request (Cerere): A petition soliciting the issuance of an individual administrative act or the execution of an administrative operation.   

Notification (Sesizare): A petition informing a public authority regarding an issue of personal or public interest. Urban defect reporting—such as documenting potholes, illegal garbage dumping, or broken streetlights—falls under the statutory definition of a sesizare under Article 9, paragraph (3).   

Proposal (Propunere): A petition seeking the adoption of public interest initiatives or policy modifications.   

Mandatory Procedural Timelines

The lifecycle of an administrative procedure initiated via a petition is governed by Article 60 (Termenul general) and related provisions of the Administrative Code:   

General Examination Timeline: An administrative procedure must conclude within 30 days from the official registration of the petition.   

Procedural Extension: When a petition requires technical appraisals, complex engineering assessments, or extensive multi-agency consultations, the statutory deadline may be extended by up to 15 to 30 working days.   

Written Justification Requirement: An extension of the examination term is legally valid only if written notice detailing the legal and factual justifications is delivered to the petitioner prior to the expiration of the initial 30-day term. The total administrative procedure cannot exceed statutory limits, generally capped at 90 days.   

Mandatory Jurisdictional Redirection: If a public authority receives a petition outside its functional jurisdiction, it must transmit the file to the competent administrative body within 5 working days of registration and simultaneously notify the petitioner of the referral.   

The Electronic Document Formalities Dichotomy

The central operational challenge in Moldovan civic tech lies in reconciling digital simplicity with statutory identification laws.   

Under Articles 72 through 75 of the Administrative Code, combined with Law nr. 124/2022 on Electronic Identification and Trust Services (Legea nr. 124/2022 privind identificarea electronică și serviciile de încredere), an electronic submission holds the legal validity of a signed paper petition only if authenticated with an advanced qualified electronic signature (semnătură electronică calificată). When a citizen submits a report through an informal web form or standard email without a qualified electronic signature, state authorities may deem the submission non-compliant, denying it the protections of the formal administrative contentious procedure (contencios administrativ).   

Municipalities have resolved this procedural barrier by creating local regulatory distinctions. Under the municipal regulations governing eu.chisinau.md, digital incident tickets are treated as informal municipal notifications (sesizări electronice) rather than formal petitions. Citizens authenticate using consumer social logins (Google, Facebook, Odnoklassniki), bypassing the need for advanced electronic signatures to submit tickets to operational departments.   

However, this distinction introduces an institutional trade-off. Informal reports lower user friction and encourage reporting, but they do not trigger the strict legal protections of the Administrative Code. If a municipal department fails to resolve a pothole logged via an informal app, the user cannot easily initiate a formal administrative appeal (cerere prealabilă under Articles 165–167) or seek judicial relief in administrative court, because the submission was never registered as a formal petition under Article 9.   

Conversely, mandating qualified digital signatures (via hardware cryptographic tokens or mobile signatures) for routine maintenance reporting creates onboarding barriers that suppress broad civic participation.

Architectural Blueprint for Civic Issue-Reporting Systems

To resolve the tension between ease of reporting, duplicate data management, and statutory administrative compliance in Moldova and Romania, civic issue platforms require a modular, decoupled architecture.

Client-Side Ingestion and Geospatial Validation

The public front-end should be structured as an accessible Progressive Web App (PWA) with responsive mobile views, matching the SocietyWorks model to ensure wide cross-platform availability without maintaining redundant codebases.   

Intake workflows must prioritize a photo-first approach. When a resident captures or uploads an image, the client application reads the device's EXIF metadata in local memory to extract latitude, longitude, and timestamps before compressing the image. If EXIF data is absent or stripped by device privacy settings, the application falls back to device GPS triangulation or manual address geocoding.   

The client evaluates the coordinates against municipal administrative boundaries using PostGIS boundary polygons. If the coordinates fall outside municipal limits (such as on an extra-urban national highway), the system informs the user and displays contact details for the national road authority. When a user selects a specific asset category (such as public lighting), the application displays active municipal infrastructure layers, prompting the resident to select the relevant asset (such as an individual numbered lamppost) to improve triage accuracy.   

Proactive Deduplication Engine

To prevent duplicate submissions from overwhelming municipal dispatchers, the intake pipeline must intercept incoming reports using a multi-tiered deduplication algorithm before saving records to the primary database.   

The deduplication engine computes a composite similarity index based on spatial, semantic, and temporal proximity:

Similarity Index=w
geo
	​

⋅S
geo
	​

+w
sem
	​

⋅S
sem
	​

+w
time
	​

⋅S
time
	​


In this model, weights are normalized such that:

w
geo
	​

+w
sem
	​

+w
time
	​

=1.0

Spatial Component (S
geo
	​

): Calculated using the Haversine distance or PostGIS ST_Distance between the incoming report and open tickets. Proximity is scored on a decaying scale:

S
geo
	​

=max(0,1−
R
max
	​

Distance
	​

)

The search radius R
max
	​

 is dynamically adjusted based on the category: small radii (R
max
	​

=30 meters) apply to discrete point assets like damaged manholes or individual trees, while larger radii (R
max
	​

=150 meters) apply to diffuse defects like road resurfacing.

Semantic Component (S
sem
	​

): Evaluates the textual similarity between user descriptions using Cosine Similarity over text embeddings:

S
sem
	​

=
∥A∥∥B∥
A⋅B
	​


To support Moldova's bilingual context, embeddings must process both Romanian and Russian vocabulary, matching synonymous urban terminology (e.g., groapă and яма).   

Temporal Component (S
time
	​

): Evaluates unresolved tickets logged within a rolling window (e.g., 14 to 30 days), scaling down for older items.

If the combined Similarity Index exceeds an established confidence threshold (e.g., Index≥0.75), the client-side interface intercepts the flow:

"A similar report was logged at this location 3 days ago and is currently marked 'In Progress' with Î.M. Lumteh. Would you like to subscribe to status updates on the existing ticket instead of filing a new report?"

[cite: 11, 14]

Municipal Dashboard and Dispatch Engine

The administrative back-office requires an operational dashboard tailored to municipal dispatchers, department heads, and field crews.   

Role-Based Access Control (RBAC) partitions incoming work queues geographically and functionally, ensuring that borough inspectors (such as Buiucani Pretură staff) and municipal enterprise engineers (such as Î.M. Exdrupo) view only tickets matching their operational responsibilities.   

To mitigate the risk of tickets stalling in the administrative queue and maintain compliance with legal frameworks, each ticket tracks two operational timelines:   

Administrative Triage SLA (72 Hours): Derived from the Maerker Serviceversprechen, the system requires dispatchers to validate competence, assign preliminary statuses, or redirect non-municipal issues within three business days.   

Statutory Procedural Clock (30 Days): Aligned with Article 60 of the Moldovan Administrative Code, this countdown tracks the statutory 30-day resolution deadline. If technical or budgetary constraints prevent immediate repairs, the dashboard prompts the official to register a formal deferral (Amânat), document the reasoning, and schedule the works into future capital plans, automatically sending an explanatory notification to the reporting resident.   

The back-office architecture should expose native endpoints compliant with the Open311 GeoReport v2 standard. This configuration allows municipal dispatchers to receive, route, and update tickets across external GIS databases, custom municipal applications, and regional platforms without requiring custom point-to-point connectors.   

The Dual-Stream Legal Compliance Model

To balance user accessibility with formal administrative law, the system should implement a dual-stream intake architecture:

[Citizen Submission Flow]
       │
       ├── Stream A: Lightweight Civic Report (Informal Sesizare)
       │     ├── Authentication: OAuth2 (Google, Apple, SMS OTP)
       │     ├── Metadata: Photo, Category, GPS Pin, Description
       │     └── Operational Track: Ingested into municipal work queues (eu.chisinau.md model)
       │
       └── Stream B: Formal Administrative Petition (Statutory Petiție)
             ├── Authentication: MPass / Qualified Digital Signature (Legea 124/2022)
             ├── Metadata: Verified Name, Domicile, IDNP, Formal Legal Request
             └── Legal Track: Triggers Art. 60 Statutory 30-Day Legal Clock & Judicial Protections


Stream A: Lightweight Civic Report (Sesizare Urbană Simplificată): Designed for rapid, low-friction reporting of common maintenance issues. Citizens authenticate via consumer OAuth2 providers (Google, Apple) or SMS one-time passwords. Reports enter municipal work queues as operational notifications under municipal platform regulations. This channel minimizes onboarding friction, driving high engagement for everyday defects.   

Stream B: Formal Administrative Petition (Petiție Administrativă Electronică): Designed for citizens seeking formal administrative rulings with judicial standing (e.g., severe property damage caused by unpruned trees, structural building violations, or chronic environmental contamination). Users authenticate via the national MPass gateway or apply an advanced qualified electronic signature.   

The platform generates a standardized petition containing all statutory data fields required under Article 75 of the Administrative Code (Petitioner Name, IDNP, Address, Administrative Body, Factual Reasoning), logs an official registration number, and initiates the enforceable 30-day administrative calendar.   

By decoupling routine civic reporting from formal administrative litigation, this dual-stream architecture minimizes participation friction for everyday urban maintenance while preserving legal enforceability when citizens require formal administrative recourse.
