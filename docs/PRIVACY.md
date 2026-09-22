# Politica de confidențialitate — Aici

> **Pentru echipa UI:** acesta este textul care trebuie pus în pagina `/privacy`
> (`src/app/(citizen)/privacy/page.tsx`). Nu inventați text nou și nu reformulați
> afirmațiile tehnice — fiecare dintre ele descrie ceva ce aplicația chiar face, verificat în
> cod. Dacă o formulare vi se pare greoaie, întrebați înainte să o schimbați.
>
> **Locurile marcate `[DE COMPLETAT]` sunt decizii care nu au fost încă luate.** Nu le
> ștergeți și nu le înlocuiți cu ceva inventat — lăsați-le vizibile până primiți răspunsul.
>
> Ultima verificare față de cod: 23 septembrie 2026.

---

**Versiune:** 0.1 (beta)
**În vigoare din:** `[DE COMPLETAT: data publicării]`

## 1. Cine suntem

Aici este o platformă prin care locuitorii municipiului Chișinău pot semnala probleme de
infrastructură (gropi în carosabil, iluminat stradal defect, gunoi neevacuat, spații verzi
deteriorate), iar primăria le poate urmări și rezolva.

**Aplicația se află în stadiu de beta** și este dezvoltată de o echipă de studenți, ca proiect
universitar. La acest moment operatorul de date, în sensul legislației privind protecția
datelor cu caracter personal, este echipa de dezvoltare, nu Primăria Municipiului Chișinău.

Acest lucru are două consecințe pe care trebuie să le cunoașteți:

- **Aici nu este, deocamdată, un canal oficial de petiționare.** O sesizare trimisă prin
  această aplicație nu declanșează automat obligațiile legale ale unei petiții adresate
  autorității publice.
- **Nu vă putem garanta că o sesizare va fi examinată sau rezolvată** de către o autoritate
  publică.

Ce se schimbă dacă platforma va fi preluată de primărie este descris în secțiunea 12.

**Contact pentru chestiuni legate de datele dumneavoastră:** `[DE COMPLETAT: adresă de e-mail]`

## 2. Ce date colectăm

### 2.1. Dacă vă creați cont

| Dată | Observații |
| --- | --- |
| Adresa de e-mail | Stocată criptat. Separat, păstrăm o valoare derivată criptografic din adresă, folosită exclusiv pentru a vă putea găsi contul la autentificare |
| Parola | Nu este stocată niciodată. Păstrăm doar un hash Argon2id, din care parola nu poate fi reconstituită |
| Data confirmării adresei de e-mail | |
| Data creării contului | |
| Sesiunile active | Un identificator de sesiune (stocat ca hash), momentul creării, ultima activitate și momentul expirării |

Nu vă cerem numele, numărul de telefon, adresa de domiciliu sau IDNP-ul.

### 2.2. Când trimiteți o sesizare

| Dată | Observații |
| --- | --- |
| Fotografia | Stocată criptat. Este reprocesată înainte de stocare — vezi secțiunea 5 |
| Categoria problemei | Una dintre cele șase categorii predefinite |
| Descrierea | Opțională, text liber, stocată criptat |
| Locația exactă | Coordonatele punctului indicat de dumneavoastră, stocate criptat |
| Locația aproximativă | Aceleași coordonate, rotunjite la aproximativ 100 de metri. **Aceasta este singura locație vizibilă public** |
| Momentul trimiterii | |
| Legătura cu contul dumneavoastră | Doar dacă erați autentificat. Sesizările trimise fără cont nu sunt legate de nicio persoană |

### 2.3. Date tehnice

- **Adresa IP** este folosită temporar pentru limitarea abuzurilor (de exemplu, pentru a
  împiedica trimiterea automată a mii de sesizări). Aceste înregistrări sunt de scurtă durată.
- **Jurnalul de audit** înregistrează acțiunile personalului primăriei asupra sesizărilor
  (cine a schimbat un statut, când, de la ce IP). **Acțiunile cetățenilor sunt înregistrate
  fără adresa IP și fără informații despre browser** — o alegere deliberată de minimizare a
  datelor.

### 2.4. Nu folosim urmărire publicitară

Aplicația nu conține cookie-uri de publicitate, pixeli de urmărire sau instrumente de
analiză a comportamentului. Singurele cookie-uri sunt cele strict necesare pentru
autentificare. Verificarea anti-robot (ALTCHA) se execută pe serverele noastre, prin calcul
criptografic în browserul dumneavoastră — nu transmite date către terți și nu vă
profilează.

## 3. De ce prelucrăm aceste date și în ce temei

| Scop | Temei juridic |
| --- | --- |
| Primirea și gestionarea sesizărilor | Consimțământul dumneavoastră, exprimat prin trimiterea sesizării |
| Crearea și administrarea contului | Consimțământul dumneavoastră |
| Afișarea sesizărilor pe harta publică, în formă anonimizată | Consimțământul dumneavoastră, cu garanțiile tehnice din secțiunea 5 |
| Securitatea platformei și prevenirea abuzurilor | Interesul legitim de a menține serviciul funcțional și de a preveni utilizarea abuzivă |

Nu folosim datele dumneavoastră în scopuri de marketing, nu le vindem și nu le punem la
dispoziția unor terți în scopuri comerciale.

## 4. Cât timp păstrăm datele

| Categorie | Perioadă |
| --- | --- |
| Fotografia, locația exactă și descrierea unei sesizări | **30 de zile de la închiderea sesizării** (marcarea ca rezolvată sau respinsă) |
| Înregistrarea anonimizată a sesizării | Nelimitat. După ștergerea elementelor de mai sus rămân doar categoria, zona aproximativă și datele calendaristice — informații care nu mai permit identificarea nimănui |
| Contul dumneavoastră | Până când îl ștergeți dumneavoastră |
| Sesiunile de autentificare | Expiră automat după o oră de inactivitate sau cel mult 30 de zile |
| Linkurile de confirmare și de resetare a parolei | 24 de ore, respectiv 15 minute |
| Jurnalul de audit | `[DE COMPLETAT: perioadă]` — jurnalul este, prin construcție, needitabil și neștergibil |

**Excepție:** dacă o sesizare este încă în lucru, dacă termenul de soluționare a fost
prelungit, sau dacă există o cerere, o contestație ori o procedură juridică în legătură cu
ea, păstrăm datele până la încheierea acesteia. Legislația permite expres această
prelungire.

> **Notă de transparență:** la momentul redactării acestui document, ștergerea automată
> descrisă mai sus **nu este încă implementată în aplicație**. Este angajamentul pe care ni-l
> asumăm și regula după care va funcționa platforma; până la implementare, datele sunt
> păstrate. Am considerat mai corect să declarăm acest lucru decât să descriem o funcție
> inexistentă.

## 5. Cum protejăm datele

Acestea nu sunt intenții, ci măsuri implementate:

- **Criptare în tranzit** (TLS) și **criptare la stocare** (AES-256-GCM) pentru adresa de
  e-mail, fotografii, descrieri, locația exactă și mesajele primăriei. Fiecare valoare este
  criptată legat de contextul ei, astfel încât o valoare criptată nu poate fi mutată în altă
  înregistrare.
- **Curățarea metadatelor fotografiilor.** Fiecare imagine este recodificată integral pe
  server înainte de stocare. Se elimină astfel datele EXIF, inclusiv **coordonatele GPS**
  înregistrate de telefon, modelul aparatului și seria acestuia.
- **Blurarea automată a chipurilor și a numerelor de înmatriculare**, prin detecție
  automată, înainte ca fotografia să fie stocată.
- **Locația publică este rotunjită la aproximativ 100 de metri.** Coordonatele exacte nu sunt
  niciodată expuse public.
- **Fotografiile și descrierile nu sunt publice.** Le pot vedea doar personalul primăriei și
  persoana care a trimis sesizarea.
- **Separarea accesului la nivel de bază de date** (row-level security), astfel încât
  restricțiile nu depind exclusiv de codul aplicației.
- **Parolele** sunt protejate cu Argon2id și verificate față de bazele publice de parole
  compromise, printr-o metodă care nu transmite parola dumneavoastră (se trimite doar un
  fragment al unei amprente criptografice).
- **Jurnalul de audit este needitabil**, garantat la nivelul bazei de date.

Nicio măsură tehnică nu oferă o garanție absolută. În cazul unui incident de securitate care
vă poate afecta drepturile, vă vom informa.

## 6. Persoanele care apar accidental în fotografii

Dacă într-o fotografie apar trecători, vehicule sau elemente ale unei locuințe, acele
persoane au, la rândul lor, drepturi asupra datelor care le privesc — chiar dacă nu au trimis
ele sesizarea.

Din acest motiv, chipurile și numerele de înmatriculare sunt blurate automat înainte de
stocare, iar fotografiile nu apar niciodată pe harta publică.

Dacă apăreți într-o fotografie trimisă de altcineva și doriți ștergerea ei, scrieți-ne la
adresa de la secțiunea 1. Nu este nevoie să aveți cont.

## 7. Ce se vede public și ce nu

| Element | Public | Primăria | Dumneavoastră |
| --- | --- | --- | --- |
| Categoria și statutul sesizării | Da | Da | Da |
| Locație aproximativă (~100 m) | Da | — | — |
| Locație exactă | Nu | Da | Da |
| Fotografia | Nu | Da | Da |
| Descrierea | Nu | Da | Da |
| Adresa dumneavoastră de e-mail | Nu | Nu¹ | Da |

¹ Personalul primăriei vede sesizarea și istoricul ei, dar nu identitatea persoanei care a
trimis-o.

Sesizările respinse nu apar deloc pe harta publică.

## 8. Cui transmitem datele

Nu vindem și nu transmitem date în scopuri comerciale. Pentru funcționarea platformei
folosim următorii furnizori, în calitate de persoane împuternicite:

| Furnizor | Rol | Locație |
| --- | --- | --- |
| Neon | Găzduirea bazei de date | Frankfurt, Germania (UE) |
| Vercel | Găzduirea aplicației | Frankfurt, Germania (UE) |
| `[DE COMPLETAT: furnizorul de e-mail]` | Trimiterea e-mailurilor de confirmare și notificare | `[DE COMPLETAT]` |
| Have I Been Pwned | Verificarea parolelor compromise | Serviciu extern, apelat fără a transmite parola |

**Datele dumneavoastră sunt stocate în Uniunea Europeană.** Nu efectuăm transferuri către
state care nu asigură un nivel adecvat de protecție.

## 9. Sesizările fără cont

Puteți trimite o sesizare fără să vă creați cont. În acest caz, sesizarea nu este legată de
nicio persoană și nu o putem asocia ulterior cu dumneavoastră.

Trebuie însă să știți că, potrivit Codului administrativ, **sesizările anonime nu constituie
petiții și nu obligă autoritatea publică să le examineze sau să răspundă.** Autoritatea poate
acționa din proprie inițiativă, dar nu este obligată.

Dacă doriți ca sesizarea să poată fi urmărită și să primiți răspuns, creați-vă cont.

## 10. Drepturile dumneavoastră

Aveți următoarele drepturi asupra datelor care vă privesc:

- **Acces** — să aflați ce date deținem despre dumneavoastră și să primiți o copie.
- **Rectificare** — să corectați datele inexacte.
- **Ștergere** — să cereți ștergerea datelor dumneavoastră.
- **Restricționare** — să cereți suspendarea prelucrării cât timp contestați exactitatea sau
  legalitatea acesteia.
- **Portabilitate** — să primiți datele într-un format structurat, lizibil automat.
- **Opoziție** — să vă opuneți prelucrării întemeiate pe interesul legitim.
- **Retragerea consimțământului**, în orice moment, fără ca aceasta să afecteze
  legalitatea prelucrării efectuate anterior.

### Cum le exercitați

Două dintre acestea funcționează direct din aplicație, din pagina contului dumneavoastră:

- **Descărcarea datelor** — un fișier cu tot ce deținem: contul, sesizările cu locația exactă,
  istoricul lor și sesiunile deschise.
- **Ștergerea contului** — contul, sesiunile și linkurile de resetare dispar definitiv.

  **Important:** sesizările trimise **rămân** la primărie, fără nicio legătură cu
  dumneavoastră. Ele devin anonime, iar pinul rămâne pe hartă. Nu le mai putem lega de
  dumneavoastră nici noi, nici altcineva — prin urmare nu le mai putem nici identifica
  ulterior, la cerere.

Pentru celelalte drepturi, scrieți-ne la adresa de la secțiunea 1.

**Termen de răspuns:** în cel mult 30 de zile calendaristice de la primirea cererii. Dacă
cererea este complexă, vă anunțăm în acest interval și vă explicăm motivul prelungirii.

## 11. Dacă aveți o plângere

Vă puteți adresa oricând Centrului Național pentru Protecția Datelor cu Caracter Personal
(CNPDCP), autoritatea de supraveghere din Republica Moldova.

Ne-ar ajuta însă dacă ne scrieți întâi nouă — de obicei putem rezolva problema mai repede
direct.

## 12. Ce se schimbă dacă platforma va fi preluată de primărie

Dacă Primăria Municipiului Chișinău va prelua platforma ca serviciu oficial, următoarele
elemente se modifică, iar această politică va fi actualizată corespunzător:

- **Operatorul de date devine primăria**, nu echipa de dezvoltare.
- **Temeiul juridic al prelucrării se schimbă** din consimțământ în îndeplinirea unei sarcini
  care servește un interes public — temei specific autorităților publice.
- **Sesizările devin petiții în sensul Codului administrativ**, cu termen legal de răspuns de
  30 de zile calendaristice (prelungibil la 45, iar în cazuri complexe până la 90), cu
  obligația de a emite un răspuns formal și cu dreptul dumneavoastră de a contesta
  tăcerea administrativă în instanța de contencios administrativ.
- **Primăria va desemna un responsabil cu protecția datelor**, obligatoriu pentru autoritățile
  publice, ale cărui date de contact vor fi publicate aici.
- Va fi necesară o **evaluare a impactului asupra protecției datelor**, obligatorie pentru
  platformele care prelucrează imagini din spațiul public și date de localizare.

## 13. Modificări ale acestei politici

Dacă modificăm această politică, publicăm versiunea nouă pe această pagină și actualizăm
data de la început. Pentru modificări importante, anunțăm utilizatorii cu cont prin e-mail.

---

## Anexă — note pentru echipă (a nu se publica)

Aceste note **nu fac parte din politică** și nu trebuie să apară în pagina publică.

### Ce rămâne de decis

1. **Adresa de contact** (secțiunea 1 și 8) — este nevoie de o adresă reală, monitorizată.
   Nu folosiți o adresă personală fără acordul explicit al persoanei.
2. **Data intrării în vigoare** — se completează la publicare.
3. **Perioada de păstrare a jurnalului de audit** (secțiunea 4).
4. **Furnizorul de e-mail** (secțiunea 8) — depinde de ce se configurează în `SMTP_HOST` la
   lansare.

### Diferențe între politică și cod, la data redactării

- **Ștergerea automată la 30 de zile după închidere nu există în cod.** Politica o declară ca
  angajament, cu o notă de transparență explicită în secțiunea 4. Ar trebui implementată
  înainte ca platforma să aibă utilizatori reali, altfel textul devine o promisiune neonorată
  — exact genul de neconcordanță pe care o autoritate de supraveghere o sancționează.
- **Perioada de păstrare a jurnalului de audit nu este definită** nici în cod, nici în politică.
  Jurnalul este append-only prin trigger în baza de date, deci ștergerea lui necesită o
  decizie tehnică separată.

### Bază legală

Afirmațiile juridice se sprijină pe cercetarea din
[`../research/c2_legal_dataprotection_report.md`](../research/c2_legal_dataprotection_report.md):
Legea nr. 133/2011 (în vigoare până la 23 august 2026), Legea nr. 195/2024 (din 23 august
2026), Codul administrativ nr. 116/2018 (art. 75 — petiții anonime; art. 84 — termene), Codul
civil nr. 1107/2002 (art. 120 — dreptul la propria imagine).

Documentul a fost redactat pentru situația actuală: beta, operator = echipa de dezvoltare.
Nu este consultanță juridică. Înainte de o lansare publică reală, textul ar trebui citit de un
jurist.
