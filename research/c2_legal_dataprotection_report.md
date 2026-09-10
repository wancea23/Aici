# c2 - MD legal & data-protection (Legea 195/2024, 133/2011, MCloud)

> Source: https://share.gemini.google/0bTlz7pjruZn
> Harvested 2026-09-10 (project: Aici).

---

Legal and Regulatory Analysis of Civic Issue-Reporting Systems in the Republic of Moldova

Deploying a municipal civic issue-reporting platform involving mobile client uploads, automated metadata ingestion, geolocation tagging, and administrative routing requires compliance with Moldovan administrative procedure, data protection legislation, public-sector IT hosting mandates, and contravention litigation standards. This report examines the applicable legal frameworks governing controllers and processors operating within the Moldovan legal order.

Data Protection Regulatory Framework: Transition from Law No. 133/2011 to Law No. 195/2024
Legislative Succession and Transition Timeline

The personal data protection regime in the Republic of Moldova is undergoing structural alignment with the European Union framework. On July 25, 2024, the Parliament of the Republic of Moldova adopted Law No. 195/2024 on the Protection of Personal Data (Legea nr. 195/2024 privind protecția datelor cu caracter personal). The law was officially published in the Official Gazette (Monitorul Oficial al Republicii Moldova) No. 367–369, art. 574, on August 23, 2024.   

Pursuant to its final and transitional provisions, Law No. 195/2024 enters into force two years from its publication date, on August 23, 2026. Until August 23, 2026, processing activities remain legally governed by Law No. 133/2011 on the Protection of Personal Data (Legea nr. 133/2011 privind protecția datelor cu caracter personal). On August 23, 2026, Law No. 133/2011 will be formally abrogated. Law No. 195/2024 directly transposes Regulation (EU) 2016/679 (General Data Protection Regulation - GDPR), transitioning the regulatory framework from formalistic administrative registration of filing systems toward proactive controller accountability (responsabilitatea operatorului).   

The independent national supervisory authority across both regimes remains the National Center for Personal Data Protection (Centrul Național pentru Protecția Datelor cu Caracter Personal - CNPDCP).   

Lawful Grounds for Processing in Civic Reporting

Determining the lawful basis for processing depends on whether the processing is executed by the municipal authority or an outsourced platform developer, as well as the specific processing phase.

Processing Activity	Lawful Basis: Law No. 133/2011	Lawful Basis: Law No. 195/2024	Technical and Procedural Scope
Municipal Receipt and Administrative Action	Art. 5(5)(a): Task carried out in the public interest or exercise of official authority.	Art. 6(1)(e): Processing necessary for the performance of a task carried out in the public interest or in the exercise of official authority vested in the controller.	Processing citizen identifying details, location, and submitted photographic evidence to fulfill statutory municipal tasks (road repairs, waste management, public space inspection).
Platform Account Registration	Art. 5(1): Consent of the data subject.	Art. 6(1)(a): Freely given, specific, informed, and unambiguous consent.	Applicable to optional user profiles, notification preferences, or non-statutory community discussion features.
Public Transparency Map / Open Civic Feed	Art. 5(1): Explicit consent (or specific statutory transparency rule).	Art. 6(1)(a) (Consent) or Art. 6(1)(e) with strict privacy safeguards.	Publishing reports to an open map viewable by third parties requires redacting all personal data unless affirmative consent is secured.

A public authority cannot rely on legitimate interests under Article 6(1)(f) of Law No. 195/2024 for processing carried out in the performance of its statutory duties. Furthermore, relying on citizen consent (Article 6(1)(a)) for handling formal administrative reports is procedurally flawed due to the power imbalance between public administrations and individuals, which compromises whether consent is "freely given". The municipal controller must ground core administrative processing in Article 6(1)(e) of Law No. 195/2024 (and Article 5(5)(a) of Law No. 133/2011), linked with the competence provisions of Law No. 436/2006 on Local Public Administration.   

Data Protection Principles

Controllers are bound by foundational principles established under Article 4 of Law No. 133/2011 and Article 5 of Law No. 195/2024:   

Purpose Limitation (Limitarea legată de scop): Data captured via civic applications can be used solely for investigating, rectifying, or prosecuting the reported incident. Secondary processing for unrelated municipal marketing, commercial exploitation, or bulk surveillance is prohibited.   

Data Minimization (Reducerea la minimum a datelor): The software architecture must limit data intake to what is strictly necessary to resolve the municipal problem. The ingestion of ancillary device telemetry, unneeded contact fields, or biometric facial captures must be actively restricted.   

Storage Limitation (Limitarea legată de stocare): Visual media and personal contact identifiers must not be held indefinitely. Platforms must implement tiered retention periods distinguishing active municipal verification, contravention trial limitation periods, and statistical archiving. When tickets are closed and statutory appeal windows expire, personally identifiable identifiers must be purged or irreversibly anonymized.   

Integrity and Confidentiality (Integritate și confidențialitate): Controllers and technology vendors must enforce end-to-end encryption in transit (TLS 1.3) and encryption at rest (AES-256), paired with role-based access control to prevent unauthorized third-party tampering.   

Data Subject Rights and Statutory Deadlines

Under Articles 12–22 of Law No. 195/2024, data subjects (both reporters and third parties incidentally captured in uploads) possess enforceable rights:   

Right of Access (Art. 15): The right to obtain confirmation as to whether personal data is processed, categories of data collected, recipients, and a copy of the stored visual evidence.   

Right to Rectification (Art. 16): Correction of inaccurate location markers, erroneous identity details, or false administrative attributions.   

Right to Erasure / "Right to be Forgotten" (Art. 17): Deletion of user data upon request. Erasure may be legally refused if retaining the data is necessary for compliance with a legal obligation or the establishment, exercise, or defense of legal claims (e.g., pending contravention proceedings).   

Right to Restriction of Processing (Art. 18) and Right to Object (Art. 21): Restricting the visibility of reports or halting processing pending the resolution of an accuracy or legality challenge.   

Statutory Response Deadlines:
Under Article 12(3) of Law No. 195/2024, the controller must respond to rights requests without undue delay and at the latest within one month of receipt. This deadline may be extended by two further months where necessary, taking into account the complexity and number of the requests, provided the applicant is notified within the initial one-month window, stating the grounds for the extension. Under the existing Law No. 133/2011 (Articles 13–17), the statutory compliance deadline is 30 calendar days from request registration.   

Controller Compliance Obligations

Law No. 195/2024 ends the requirement to register individual databases with the CNPDCP, replacing it with an active internal compliance regime:   

Records of Processing Activities (Art. 30): Controllers and processors must maintain written documentation detailing processing purposes, data subject categories, recipient disclosures, and implemented security safeguards.   

Data Protection Impact Assessment (DPIA - Art. 35): Mandatory prior to deploying platforms that process public-space imagery, deploy systematic geolocation logging, or systematically capture data involving vulnerable populations.   

Designation of a Data Protection Officer (DPO - Art. 37): Mandatory for all public authorities (including city halls and district councils) and private technology vendors whose core operations require large-scale systematic monitoring.   

Data Breach Notification (Arts. 33–34): In the event of a security incident, the controller must notify the CNPDCP without undue delay and, where feasible, within 72 hours of becoming aware of it. Notifications must use the standardized form (Formularul tipizat al notificării încălcării securității datelor cu caracter personal), promulgated via CNPDCP Order No. 40/2026. When a breach poses a high risk to citizen rights, affected individuals must be notified directly without undue delay under Article 34.   

Penalties and Gradual Enforcement Structure

Law No. 195/2024 establishes administrative fines proportional to business scale and operational severity. Moldovan law sets the maximum financial liability at 2% of annual turnover or 2,000,000 MDL, departing from the 4% / 20,000,000 EUR threshold found in EU GDPR Article 83.   

Sanction Category	Governing Articles	Statutory Fine Upper Bound	Typical Non-Compliance Violations
Tier 1: Substantive Violations	Arts. 5, 6, 7, 9, 12–22	

Up to 2,000,000 MDL or 2% of total global annual turnover (whichever is higher).

	

Processing data without a valid legal ground; failing to respond to erasure or access requests; publishing unredacted personal data without consent.


Tier 2: Operational / Technical Violations	Arts. 8, 11, 25–39	

Up to 1,000,000 MDL or 1% of total global annual turnover (whichever is higher).

	

Failing to maintain processing registers; omitting a mandatory DPIA; failing to designate a required DPO; late breach notification to CNPDCP.

  

To facilitate institutional adaptation, Law No. 195/2024 establishes a phased application of financial sanctions following its entry into force on August 23, 2026:   

Year 1 (August 23, 2026 – August 22, 2027): The CNPDCP can enforce a maximum of 10% of the statutory sanction (Tier 1 cap: 200,000 MDL or 0.2% turnover).   

Year 2 (August 23, 2027 – August 22, 2028): The CNPDCP can enforce a maximum of 40% of the statutory sanction (Tier 1 cap: 800,000 MDL or 0.8% turnover).   

Year 3 Onward (From August 23, 2028): Full enforcement of 100% of statutory caps applies.   

Prior to August 23, 2026, data violations are sanctioned under Article 74/1 of the Contravention Code of the Republic of Moldova (Codul contravențional nr. 218/2008), which imposes fines calculated in conventional units (unități convenționale, 1 unit = 50 MDL). Fines range from 60 to 300 conventional units (3,000–15,000 MDL) for natural persons, and up to 1,000 conventional units (50,000 MDL) for legal entities and public officials.

Incidental Photographic Captures: Third-Party Faces, License Plates, and Residential Identifiers
Classification of Incidental Visual Data

Photographs uploaded by citizens to document physical municipal defects frequently capture third-party visual identifiers. Under Article 3 of Law No. 133/2011 and Article 4 of Law No. 195/2024, an identifiable natural person is one who can be identified, directly or indirectly:   

Human Faces: Direct physical identifiers that disclose physiological traits, emotional states, and individual physical appearance.   

Vehicle License Plates (Numere de înmatriculare): Distinct alphanumeric markers. Although an ordinary citizen cannot query the underlying registration records, municipal authorities and police departments can access the State Transport Register (Registrul de Stat al Transporturilor) administered by the Public Services Agency (Agenția Servicii Publice - ASP). Because the public authority can link the plate directly to the owner, vehicle registration numbers constitute personal data.   

House Numbers and Private Curvilinear Features: High-resolution depictions of single-family residence doorbells, property nameplates, or specific window views cross-referenced with precise GPS tags constitute indirect personal data identifying the property's occupants.   

Ingestion vs. Public Dissemination: The Legal Requirement to Blur

The legal obligation to blur or anonymize visual identifiers depends on whether the processing is strictly internal-administrative or publicly accessible.

For internal administrative storage and municipal evaluation, automated pre-ingestion blurring is not legally mandatory, provided the data is stored in a secure repository accessible only to authorized municipal officers. Removing or obscuring elements prior to municipal review can undermine evidentiary value. For example, if a report concerns an illegally parked vehicle obstructing municipal transit, blurring the license plate before administrative review prevents the municipal enforcement agent (agentul constatator) from investigating the violation. Processing raw imagery internally is justified under Article 6(1)(e) of Law No. 195/2024 and Article 5(5)(a) of Law No. 133/2011 as necessary for the exercise of official authority.   

For public dashboards, civic feeds, and open transparency portals, blurring is strictly mandatory prior to publication. Publishing identifiable faces of passersby, license plates of uninvolved vehicles, or private residential details on a public webpage without consent violates Article 5(1)(a)–(c) of Law No. 195/2024 and Article 120 of the Moldovan Civil Code (Codul civil nr. 1107/2002), which guarantees the right to one's own image (dreptul la propria imagine). Public display of such details constitutes unauthorized processing and unlawful disclosure (divulgare neautorizată), exposing the platform operator and municipality to administrative sanctions from the CNPDCP.   

Software Engineering Redaction Protocol

To maintain compliance with data protection laws without compromising the evidentiary value of reports, platforms should implement a dual-path media processing workflow:

Ingestion Validation: The client device uploads the raw photograph alongside its EXIF payload over an encrypted channel directly to a restricted, internal municipal bucket.   

Automated Pipeline Redaction: Prior to making any submission visible to external users or open municipal maps, an automated processing script (e.g., using an on-premise computer vision filter) detects and permanently blurs all human faces, non-offending vehicle license plates, and private address plaques.   

Public Asset Generation: Only the redacted derivative image is assigned an external URL and displayed publicly. The original unredacted image remains restricted to certified municipal investigators, subject to audit logging and retention limits.   

Geolocation Data, Metadata Extraction, and Reporter Safeguards
Identifiability via EXIF Metadata

Exchangeable Image File Format (EXIF) metadata embedded inside digital camera photographs generally includes precise GNSS latitude and longitude coordinates, elevation, timestamp details (year, month, day, second), device hardware model, serial number, and camera sensor parameters.

Under Moldovan data protection law, location data combined with temporal markers constitutes personal data. Even if an individual submits a report without supplying their name, a photo taken from inside a residential perimeter or a sequence of reports submitted regularly from the same residential or commercial coordinates allows the reporter to be identified through pattern analysis. Consequently, EXIF metadata cannot be classified as anonymous data; it must be protected as personally identifiable information.   

Sensitive Reporting and Whistleblower Law Scope

Civic platforms often receive reports concerning sensitive violations, such as illegal construction (construcții neautorizate), encroachment on protected green spaces, environmental damage, or properties associated with public officials. These submissions create legal exposure for reporters if their identities are disclosed.

In the Republic of Moldova, civic reporters generally do not qualify for the specialized protections of Law No. 165/2023 on Whistleblowers (Legea nr. 165/2023 privind avertizorii de integritate). Article 3 of Law No. 165/2023 restricts the definition of a whistleblower (avertizor de integritate) to an employee, former employee, contractor, or intern who reports statutory infringements acquired within a work-based professional context (context profesional). An ordinary resident reporting a zoning violation or municipal hazard is acting as an external citizen petitioner rather than an institutional whistleblower.   

Consequently, the reporter's legal protection against retaliation or disclosure relies on general statutory privacy safeguards:

Controller Duty of Confidentiality: Under Article 29 of Law No. 133/2011 and Article 5(1)(f) and Article 32 of Law No. 195/2024, municipal personnel and system administrators must maintain professional confidentiality. Disclosing a reporter's personal details, phone number, or raw submission data to the subject of a complaint (such as an illegal builder) constitutes an actionable violation punishable by the CNPDCP.   

Administrative Record Redaction: Under the Moldovan Administrative Code (Codul administrativ nr. 116/2018), when a party to an administrative case inspects case files, the administrative body must protect third-party personal data and sensitive identifying information.

Legal Status of Anonymous Reporting

The viability of anonymous reporting depends on the distinction between a formal petition and an informal civic tip:

Civic Submission via App
   │
   ├─► Anonymous Report (No name / address / email)
   │     └─► Administrative Code Art. 75(1): Petition IS NOT examined
   │     └─► No statutory deadline, no obligation to act, no appeal rights
   │     └─► Municipality MAY act purely ex officio (din oficiu)
   │
   └─► Identified Report (Name + verified electronic address)
         └─► Formal Petition (Administrative Code Arts. 68, 75)
         └─► Mandatory chancellery registration
         └─► Statutory deadline: 30 days (Art. 84)
         └─► Obligation to issue formal resolution / administrative act
         └─► Judicial standing in administrative litigation (contencios)


Article 75(1) of the Administrative Code (Legea nr. 116/2018) establishes that:

"Petițiile anonime sau cele depuse fără indicarea adresei poștale sau electronice a petiționarului nu se examinează." (Anonymous petitions or those filed without the postal or electronic address of the petitioner shall not be examined).   

If a civic platform allows anonymous submissions:

No Legal Obligation to Act: The municipal administration is not legally required to inspect, resolve, or reply to the submission.   

No Procedural Remedies: An anonymous submitter cannot claim administrative silence (refuz nejustificat) or file an action in administrative court (acțiune în contencios administrativ).   

Ex Officio Discretion: The municipality retains the legal authority to investigate the report ex officio (din oficiu) using its general policing and municipal oversight powers, but this is discretionary.   

To provide both public privacy and administrative enforceability, the application should support pseudonymous reporting: the client verifies the user's identity during account creation (via email, mobile number, or the governmental authentication platform MPass), while the public-facing dashboard displays only a generic pseudonym (e.g., "Resident #402"). This satisfies the formal identification requirements of Article 75 for the municipality's intake register, while safeguarding the reporter's public privacy.   

Municipal Hosting: Government Decision No. 128/2014, MCloud, and Cross-Border Cloud Compliance
Application of Government Decision No. 128/2014 (MCloud Platform)

Government Decision No. 128/2014 on the Common Governmental Technological Platform (MCloud) (Hotărârea Guvernului nr. 128/2014 privind platforma tehnologică guvernamentală comună) governs cloud hosting for public authorities. The operational scope of this mandate depends on the tier of public administration:   

Central Public Authorities (APC): Ministries, state agencies, and subordinate state bodies are mandated under point 3 of HG No. 128/2014 to host state information systems exclusively on the shared government infrastructure, MCloud, operated by the Information Technology and Cyber Security Service (Serviciul Tehnologia Informației și Securitate Cibernetică - STISC).   

Local Public Authorities (APL - Municipalities): Pursuant to HG No. 128/2014 and associated national digitalization decisions, the central government recommends that local public authorities use the MCloud infrastructure ("Se recomandă autorităților administrației publice locale..."). Because local public authorities enjoy administrative and budgetary autonomy guaranteed by Law No. 436/2006, HG No. 128/2014 does not legally compel a city hall (primărie) to host all applications on MCloud.   

While hosting on MCloud is not statutorily mandatory for municipalities, doing so facilitates technical integration with government-wide digital services, including MPass (authentication), MConnect (interoperability), and MSign (electronic signatures).   

Legal Conditions for Commercial or Foreign Cloud Deployments

A municipality may use commercial or foreign cloud service providers (e.g., AWS, Google Cloud, Microsoft Azure, or commercial Moldovan data centers), provided the deployment satisfies three distinct legal requirements:

1. Cross-Border Personal Data Transfer Requirements

Under Article 32 of Law No. 133/2011 and Articles 44–49 of Law No. 195/2024, cross-border data transfers are strictly regulated:   

Transfers within the EU/EEA: The CNPDCP considers states in the European Economic Area to maintain an adequate level of data protection. Deploying an application to data center regions in the EU (e.g., Frankfurt, Dublin, Warsaw) does not require separate CNPDCP transfer authorization.   

Transfers to Third Countries (e.g., United States): If data is routed through or hosted on infrastructure in third countries that lack an adequacy decision from the CNPDCP, the municipality must implement appropriate transfer safeguards. These safeguards include Standard Contractual Clauses (clauze contractuale tipizate de protecție a datelor) promulgated under CNPDCP regulatory orders.   

2. Mandatory Data Processing Agreement

Under Article 28 of Law No. 195/2024 and Article 19 of Law No. 133/2011, engaging an external hosting provider requires a written Data Processing Agreement (DPA). The agreement must legally bind the processor to:   

Act exclusively on documented instructions from the municipality;   

Implement technical and organizational security measures meeting national benchmarks;   

Notify the municipality immediately of any data breach to ensure the 72-hour reporting deadline to the CNPDCP can be met;   

Ensure that all platform data is deleted or returned to the municipality upon contract termination.   

3. Cybersecurity Standards for State Information Resources

Under Law No. 48/2023 on Cybersecurity (Legea nr. 48/2023 privind securitatea cibernetică) and Law No. 467/2003 on Informatization and State Information Resources, municipal platforms that process citizen reports and link with municipal registers must maintain baseline cybersecurity controls. When procuring commercial hosting, the platform must be backed by ISO/IEC 27001 certification and satisfy the technical security guidelines issued by the National Cybersecurity Agency (Agenția Națională pentru Securitate Cibernetică - ANSC) and STISC.   

Legal Status of the Report and Evidentiary Value in Contravention Proceedings
Administrative Obligations under the Administrative Code (Law No. 116/2018)

When a citizen submits an issue report through an app providing their real name and valid electronic contact information, the report constitutes a formal petition under the Moldovan Administrative Code (Codul administrativ nr. 116/2018). This status triggers specific statutory duties for the receiving authority:   

Petition Ingestion and Examination Lifecycle
   │
   ├─► Ingestion: Official chancellery registration (Art. 68 Cod administrativ)
   │
   ├─► Competence Assessment (Art. 74)
   │     ├─► If outside municipal jurisdiction:
   │     │     └─► Mandatory referral to competent authority within 5 business days
   │     │     └─► Mandatory written notice to petitioner
   │     │
   │     └─► If within municipal jurisdiction:
   │           └─► Proceed to factual examination
   │
   ├─► Ex Officio Investigation (Art. 20)
   │     └─► Municipal technical staff verify facts on-site or via public registers
   │
   └─► Resolution & Administrative Response (Art. 84)
         ├─► Standard Statutory Deadline: 30 calendar days
         ├─► Permissible Extension: Up to 15 additional days (Max total: 45 days)
         ├─► Complex Technical / Factual Inquiries: Max total: 90 days
         └─► Enforcement: Failure to respond within deadlines allows the citizen
             to bring an action in Administrative Court (contencios administrativ)


Registration Requirement: Under Article 68, the municipal authority must log the incoming electronic petition in its official entry register.   

Referral for Non-Competence (Art. 74): If the report addresses an issue outside municipal jurisdiction (e.g., an unauthorized cut into a national highway under the State Road Administration, or illegal utility tampering), the authority must formally redirect the petition to the competent body within 5 business days and inform the petitioner.   

Duty of Ex Officio Investigation (Art. 20): The municipality cannot rely solely on the citizen's assertion; it is legally required to verify the factual circumstances through technical inspections or administrative verifications.

Statutory Response Deadline (Art. 84):

The standard deadline for examining and responding to a petition is 30 calendar days from registration.   

Under Article 84(2), this period may be extended by up to 15 calendar days (or in complex technical inquiries, up to a maximum total of 90 calendar days), provided the petitioner is formally notified prior to the expiration of the initial 30-day window.

Enforcement and Judicial Remedies: If the municipality fails to resolve the petition within the statutory timeframe, the petitioner can challenge this administrative inaction (refuz nejustificat) in the competent District Court (Judecătoria de circumscripție) under Title III of the Administrative Code.   

Admissibility of Photos and Metadata under the Contravention Code (Law No. 218/2008)

Civic issue reports frequently document infractions governed by the Contravention Code of the Republic of Moldova (Codul contravențional nr. 218/2008), such as illegal construction (Art. 179), illegal waste disposal (Art. 154), or traffic and parking violations (Art. 238).   

Legal Status as a Notification under Article 440

A citizen upload via an app does not allow an algorithm or municipal clerk to issue an automatic fine. Under Article 440 of the Contravention Code, the citizen's submission functions as a denunciation / notification of an infraction (sesizare despre săvârșirea unei contravenții). It provides the legal basis for an authorized enforcement officer (agent constatator) to initiate contravention proceedings.   

Evidentiary Value under Article 425

Photographs, digital recordings, and embedded EXIF metadata can serve as material evidence within contravention proceedings:   

Statutory Basis (Art. 425): Article 425(1) and (4) admits audio-visual materials, digital documents, and physical records as evidence (mijloace de probă) capable of demonstrating the commission of a contravention.   

Principle of Free Assessment of Evidence (Art. 27): Under Article 27 of the Contravention Code, digital photographic evidence has no predetermined probative value. The enforcement officer and the contravention court evaluate submitted photos based on all corroborated evidence collected in the case file.   

Procedural Verification by the Agent Constatator: Because consumer digital images can be altered, staged, or misattributed, an enforcement officer cannot issue a contravention sanction based solely on an uncorroborated civic upload. The officer must:

Verify the vehicle, construction site, or environmental hazard depicted against official state databases (e.g., ASP vehicle registries, Cadastral registers);   

Conduct an on-site physical inspection where feasible, documenting findings in a formal inspection protocol (proces-verbal de cercetare la fața locului);

Confirm that visible landmarks in the photograph correspond with the embedded GPS coordinates and street topography.   

Chain of Custody and Digital Authenticity Requirements

To prevent photographic evidence from being dismissed in court, the application platform must preserve digital integrity from the moment of capture:

Cryptographic Hashing at Ingestion: The platform should compute an irreversible cryptographic hash (e.g., SHA-256) of the raw photograph and its EXIF metadata immediately upon arrival at the municipal API server.   

Server-Side Timestamping: Relying exclusively on client-side smartphone timestamps is procedurally vulnerable, as device clocks can be altered. The platform must log an authoritative server timestamp upon ingestion.

Audit Trail Maintenance: The database must maintain an immutable audit trail showing that the raw photograph presented as evidence in the contravention report (proces-verbal cu privire la contravenție) is an unedited duplicate of the file originally transmitted by the citizen.   

Synthesis of Compliance Requirements for Civic Reporting Platforms
Domain	Statutory Authority & Legal Article	Compliance Deadline	Enforcing Body	Mandatory Technical / Operational Implementation
Data Protection (Current)	Law No. 133/2011, Arts. 4, 5, 13–17, 29	30 calendar days for data subject requests	CNPDCP	

Ground processing in municipal public task (Art. 5(5)(a)); maintain strict employee confidentiality.


Data Protection (From Aug 23, 2026)	Law No. 195/2024, Arts. 5, 6, 12–22, 33, 35, 37	

1 month for data subject requests; 72 hours for breach notice

	CNPDCP	

Conduct a DPIA (Art. 35); designate a DPO (Art. 37); maintain processing records (Art. 30); adopt breach notification Form No. 40/2026.


Third-Party Data & Visual Media	

Law No. 195/2024, Art. 5; Civil Code, Art. 120; Law No. 133/2011, Art. 4

	Immediate upon ingestion for public feeds	CNPDCP; Civil Courts	

Implement automated computer vision blurring for faces, uninvolved plates, and house numbers on public-facing displays.


Reporter Identity & Petitions	

Administrative Code (Law No. 116/2018), Arts. 68, 74, 75, 84

	

5 days for referral; 30 days for petition response (up to 45/90 days for complex inquiries)

	

Administrative Courts (Contencios administrativ)

	

Require verified contact credentials for formal complaints, but support pseudonymous public profiles. Treat anonymous reports as discretionary intelligence.


Public Sector Infrastructure	

Government Decision No. 128/2014; Law No. 48/2023 on Cybersecurity

	Ongoing operational baseline	STISC; ANSC	

MCloud is statutorily recommended for local authorities; commercial/foreign cloud requires DPA, EU/EEA localization or SCCs, and ISO 27001 standards.


Contravention Evidence Integrity	

Contravention Code (Law No. 218/2008), Arts. 27, 425, 440

	Applicable throughout statutory prosecution limits	

Municipal Agenți Constatatori; Courts

	

Treat civic uploads as procedural notifications (sesizări); compute SHA-256 hashes of original media and preserve EXIF metadata to ensure legal admissibility.
