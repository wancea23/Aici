import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import SiteFooter from "@/ui/SiteFooter";
import SiteHeader from "@/ui/SiteHeader";
import { linkClass } from "@/ui/themed-styles";

// Text copied from docs/PRIVACY.md word for word, the team annex left out.
// The [DE COMPLETAT] spots stay visible until the team decides them.
export const metadata: Metadata = { title: "Confidențialitate" };

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-outline-variant/60 pt-space-lg">
      <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
      <div className="mt-space-sm flex flex-col gap-space-sm">{children}</div>
    </section>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return <h3 className="mt-space-sm font-headline-sm text-headline-sm text-on-surface">{children}</h3>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="font-body-md text-body-md text-on-surface-variant">{children}</p>;
}

function List({ children }: { children: ReactNode }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 font-body-md text-body-md text-on-surface-variant marker:text-outline">
      {children}
    </ul>
  );
}

function B({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-on-surface">{children}</strong>;
}

function Todo({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-secondary-container px-1.5 py-0.5 font-label-md text-label-md text-on-secondary-fixed">
      [DE COMPLETAT{children ? <>: {children}</> : null}]
    </span>
  );
}

// Tables scroll inside their own box on phones so the page never scrolls sideways
function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant">
      <table className="w-full min-w-[32rem] border-collapse text-left font-body-sm text-body-sm">
        <thead className="bg-surface-container-low">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2 font-label-lg text-label-lg text-on-surface">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-outline-variant/60 align-top">
              {row.map((cell, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? "text-on-surface" : "text-on-surface-variant"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const contents = [
  ["cine", "1. Cine suntem"],
  ["date", "2. Ce date colectăm"],
  ["temei", "3. De ce prelucrăm aceste date și în ce temei"],
  ["pastrare", "4. Cât timp păstrăm datele"],
  ["protectie", "5. Cum protejăm datele"],
  ["fotografii", "6. Persoanele care apar accidental în fotografii"],
  ["public", "7. Ce se vede public și ce nu"],
  ["furnizori", "8. Cui transmitem datele"],
  ["fara-cont", "9. Sesizările fără cont"],
  ["drepturi", "10. Drepturile dumneavoastră"],
  ["plangere", "11. Dacă aveți o plângere"],
  ["primarie", "12. Ce se schimbă dacă platforma va fi preluată de primărie"],
  ["modificari", "13. Modificări ale acestei politici"],
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-10">
        <article className="flex flex-col gap-space-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-space-lg sm:p-space-xl">
          <header>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface sm:font-headline-lg sm:text-headline-lg">
              Politica de confidențialitate
            </h1>
            <p className="mt-space-sm font-body-sm text-body-sm text-on-surface-variant">
              <B>Versiune:</B> 0.1 (beta) · <B>În vigoare din:</B> <Todo>data publicării</Todo>
            </p>
          </header>

          <nav aria-label="Cuprins" className="rounded-lg bg-surface-container-low p-space-md">
            <p className="font-label-lg text-label-lg text-on-surface">Cuprins</p>
            <ol className="mt-2 grid gap-1 sm:grid-cols-2">
              {contents.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="font-body-sm text-body-sm text-primary hover:underline">
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <Section id="cine" title="1. Cine suntem">
            <P>
              Aici este o platformă prin care locuitorii municipiului Chișinău pot semnala probleme de infrastructură
              (gropi în carosabil, iluminat stradal defect, gunoi neevacuat, spații verzi deteriorate), iar primăria le
              poate urmări și rezolva.
            </P>
            <P>
              <B>Aplicația se află în stadiu de beta</B> și este dezvoltată de o echipă de studenți, ca proiect
              universitar. La acest moment operatorul de date, în sensul legislației privind protecția datelor cu
              caracter personal, este echipa de dezvoltare, nu Primăria Municipiului Chișinău.
            </P>
            <P>Acest lucru are două consecințe pe care trebuie să le cunoașteți:</P>
            <List>
              <li>
                <B>Aici nu este, deocamdată, un canal oficial de petiționare.</B> O sesizare trimisă prin această
                aplicație nu declanșează automat obligațiile legale ale unei petiții adresate autorității publice.
              </li>
              <li>
                <B>Nu vă putem garanta că o sesizare va fi examinată sau rezolvată</B> de către o autoritate publică.
              </li>
            </List>
            <P>Ce se schimbă dacă platforma va fi preluată de primărie este descris în secțiunea 12.</P>
            <P>
              <B>Contact pentru chestiuni legate de datele dumneavoastră:</B> <Todo>adresă de e-mail</Todo>
            </P>
          </Section>

          <Section id="date" title="2. Ce date colectăm">
            <Sub>2.1. Dacă vă creați cont</Sub>
            <Table
              head={["Dată", "Observații"]}
              rows={[
                [
                  "Adresa de e-mail",
                  "Stocată criptat. Separat, păstrăm o valoare derivată criptografic din adresă, folosită exclusiv pentru a vă putea găsi contul la autentificare",
                ],
                ["Parola", "Nu este stocată niciodată. Păstrăm doar un hash Argon2id, din care parola nu poate fi reconstituită"],
                ["Data confirmării adresei de e-mail", ""],
                ["Data creării contului", ""],
                [
                  "Sesiunile active",
                  "Un identificator de sesiune (stocat ca hash), momentul creării, ultima activitate și momentul expirării",
                ],
              ]}
            />
            <P>Nu vă cerem numele, numărul de telefon, adresa de domiciliu sau IDNP-ul.</P>

            <Sub>2.2. Când trimiteți o sesizare</Sub>
            <Table
              head={["Dată", "Observații"]}
              rows={[
                ["Fotografia", "Stocată criptat. Este reprocesată înainte de stocare — vezi secțiunea 5"],
                ["Categoria problemei", "Una dintre cele șase categorii predefinite"],
                ["Descrierea", "Opțională, text liber, stocată criptat"],
                ["Locația exactă", "Coordonatele punctului indicat de dumneavoastră, stocate criptat"],
                [
                  "Locația aproximativă",
                  <>
                    Aceleași coordonate, rotunjite la aproximativ 100 de metri.{" "}
                    <B>Aceasta este singura locație vizibilă public</B>
                  </>,
                ],
                ["Momentul trimiterii", ""],
                [
                  "Legătura cu contul dumneavoastră",
                  "Doar dacă erați autentificat. Sesizările trimise fără cont nu sunt legate de nicio persoană",
                ],
              ]}
            />

            <Sub>2.3. Date tehnice</Sub>
            <List>
              <li>
                <B>Adresa IP</B> este folosită temporar pentru limitarea abuzurilor (de exemplu, pentru a împiedica
                trimiterea automată a mii de sesizări). Aceste înregistrări sunt de scurtă durată.
              </li>
              <li>
                <B>Jurnalul de audit</B> înregistrează acțiunile personalului primăriei asupra sesizărilor (cine a
                schimbat un statut, când, de la ce IP).{" "}
                <B>Acțiunile cetățenilor sunt înregistrate fără adresa IP și fără informații despre browser</B> — o
                alegere deliberată de minimizare a datelor.
              </li>
            </List>

            <Sub>2.4. Nu folosim urmărire publicitară</Sub>
            <P>
              Aplicația nu conține cookie-uri de publicitate, pixeli de urmărire sau instrumente de analiză a
              comportamentului. Singurele cookie-uri sunt cele strict necesare pentru autentificare. Verificarea
              anti-robot (ALTCHA) se execută pe serverele noastre, prin calcul criptografic în browserul dumneavoastră —
              nu transmite date către terți și nu vă profilează.
            </P>
          </Section>

          <Section id="temei" title="3. De ce prelucrăm aceste date și în ce temei">
            <Table
              head={["Scop", "Temei juridic"]}
              rows={[
                ["Primirea și gestionarea sesizărilor", "Consimțământul dumneavoastră, exprimat prin trimiterea sesizării"],
                ["Crearea și administrarea contului", "Consimțământul dumneavoastră"],
                [
                  "Afișarea sesizărilor pe harta publică, în formă anonimizată",
                  "Consimțământul dumneavoastră, cu garanțiile tehnice din secțiunea 5",
                ],
                [
                  "Securitatea platformei și prevenirea abuzurilor",
                  "Interesul legitim de a menține serviciul funcțional și de a preveni utilizarea abuzivă",
                ],
              ]}
            />
            <P>
              Nu folosim datele dumneavoastră în scopuri de marketing, nu le vindem și nu le punem la dispoziția unor
              terți în scopuri comerciale.
            </P>
          </Section>

          <Section id="pastrare" title="4. Cât timp păstrăm datele">
            <Table
              head={["Categorie", "Perioadă"]}
              rows={[
                [
                  "Fotografia, locația exactă și descrierea unei sesizări",
                  <B key="b">30 de zile de la închiderea sesizării (marcarea ca rezolvată sau respinsă)</B>,
                ],
                [
                  "Înregistrarea anonimizată a sesizării",
                  "Nelimitat. După ștergerea elementelor de mai sus rămân doar categoria, zona aproximativă și datele calendaristice — informații care nu mai permit identificarea nimănui",
                ],
                ["Contul dumneavoastră", "Până când îl ștergeți dumneavoastră"],
                ["Sesiunile de autentificare", "Expiră automat după o oră de inactivitate sau cel mult 30 de zile"],
                ["Linkurile de confirmare și de resetare a parolei", "24 de ore, respectiv 15 minute"],
                [
                  "Jurnalul de audit",
                  <>
                    <Todo>perioadă</Todo> — jurnalul este, prin construcție, needitabil și neștergibil
                  </>,
                ],
              ]}
            />
            <P>
              <B>Excepție:</B> dacă o sesizare este încă în lucru, dacă termenul de soluționare a fost prelungit, sau
              dacă există o cerere, o contestație ori o procedură juridică în legătură cu ea, păstrăm datele până la
              încheierea acesteia. Legislația permite expres această prelungire.
            </P>
            <div className="rounded-lg border-l-4 border-secondary bg-surface-container-low p-space-md">
              <P>
                <B>Notă de transparență:</B> la momentul redactării acestui document, ștergerea automată descrisă mai
                sus <B>nu este încă implementată în aplicație</B>. Este angajamentul pe care ni-l asumăm și regula după
                care va funcționa platforma; până la implementare, datele sunt păstrate. Am considerat mai corect să
                declarăm acest lucru decât să descriem o funcție inexistentă.
              </P>
            </div>
          </Section>

          <Section id="protectie" title="5. Cum protejăm datele">
            <P>Acestea nu sunt intenții, ci măsuri implementate:</P>
            <List>
              <li>
                <B>Criptare în tranzit</B> (TLS) și <B>criptare la stocare</B> (AES-256-GCM) pentru adresa de e-mail,
                fotografii, descrieri, locația exactă și mesajele primăriei. Fiecare valoare este criptată legat de
                contextul ei, astfel încât o valoare criptată nu poate fi mutată în altă înregistrare.
              </li>
              <li>
                <B>Curățarea metadatelor fotografiilor.</B> Fiecare imagine este recodificată integral pe server înainte
                de stocare. Se elimină astfel datele EXIF, inclusiv <B>coordonatele GPS</B> înregistrate de telefon,
                modelul aparatului și seria acestuia.
              </li>
              <li>
                <B>Blurarea automată a chipurilor și a numerelor de înmatriculare</B>, prin detecție automată, înainte
                ca fotografia să fie stocată.
              </li>
              <li>
                <B>Locația publică este rotunjită la aproximativ 100 de metri.</B> Coordonatele exacte nu sunt
                niciodată expuse public.
              </li>
              <li>
                <B>Fotografiile și descrierile nu sunt publice.</B> Le pot vedea doar personalul primăriei și persoana
                care a trimis sesizarea.
              </li>
              <li>
                <B>Separarea accesului la nivel de bază de date</B> (row-level security), astfel încât restricțiile nu
                depind exclusiv de codul aplicației.
              </li>
              <li>
                <B>Parolele</B> sunt protejate cu Argon2id și verificate față de bazele publice de parole compromise,
                printr-o metodă care nu transmite parola dumneavoastră (se trimite doar un fragment al unei amprente
                criptografice).
              </li>
              <li>
                <B>Jurnalul de audit este needitabil</B>, garantat la nivelul bazei de date.
              </li>
            </List>
            <P>
              Nicio măsură tehnică nu oferă o garanție absolută. În cazul unui incident de securitate care vă poate
              afecta drepturile, vă vom informa.
            </P>
          </Section>

          <Section id="fotografii" title="6. Persoanele care apar accidental în fotografii">
            <P>
              Dacă într-o fotografie apar trecători, vehicule sau elemente ale unei locuințe, acele persoane au, la
              rândul lor, drepturi asupra datelor care le privesc — chiar dacă nu au trimis ele sesizarea.
            </P>
            <P>
              Din acest motiv, chipurile și numerele de înmatriculare sunt blurate automat înainte de stocare, iar
              fotografiile nu apar niciodată pe harta publică.
            </P>
            <P>
              Dacă apăreți într-o fotografie trimisă de altcineva și doriți ștergerea ei, scrieți-ne la adresa de la
              secțiunea 1. Nu este nevoie să aveți cont.
            </P>
          </Section>

          <Section id="public" title="7. Ce se vede public și ce nu">
            <Table
              head={["Element", "Public", "Primăria", "Dumneavoastră"]}
              rows={[
                ["Categoria și statutul sesizării", "Da", "Da", "Da"],
                ["Locație aproximativă (~100 m)", "Da", "—", "—"],
                ["Locație exactă", "Nu", "Da", "Da"],
                ["Fotografia", "Nu", "Da", "Da"],
                ["Descrierea", "Nu", "Da", "Da"],
                ["Adresa dumneavoastră de e-mail", "Nu", "Nu¹", "Da"],
              ]}
            />
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              ¹ Personalul primăriei vede sesizarea și istoricul ei, dar nu identitatea persoanei care a trimis-o.
            </p>
            <P>Sesizările respinse nu apar deloc pe harta publică.</P>
          </Section>

          <Section id="furnizori" title="8. Cui transmitem datele">
            <P>
              Nu vindem și nu transmitem date în scopuri comerciale. Pentru funcționarea platformei folosim următorii
              furnizori, în calitate de persoane împuternicite:
            </P>
            <Table
              head={["Furnizor", "Rol", "Locație"]}
              rows={[
                ["Neon", "Găzduirea bazei de date", "Frankfurt, Germania (UE)"],
                ["Vercel", "Găzduirea aplicației", "Frankfurt, Germania (UE)"],
                [
                  <Todo key="t">furnizorul de e-mail</Todo>,
                  "Trimiterea e-mailurilor de confirmare și notificare",
                  <Todo key="t2">{null}</Todo>,
                ],
                ["Have I Been Pwned", "Verificarea parolelor compromise", "Serviciu extern, apelat fără a transmite parola"],
              ]}
            />
            <P>
              <B>Datele dumneavoastră sunt stocate în Uniunea Europeană.</B> Nu efectuăm transferuri către state care
              nu asigură un nivel adecvat de protecție.
            </P>
          </Section>

          <Section id="fara-cont" title="9. Sesizările fără cont">
            <P>
              Puteți trimite o sesizare fără să vă creați cont. În acest caz, sesizarea nu este legată de nicio persoană
              și nu o putem asocia ulterior cu dumneavoastră.
            </P>
            <P>
              Trebuie însă să știți că, potrivit Codului administrativ,{" "}
              <B>
                sesizările anonime nu constituie petiții și nu obligă autoritatea publică să le examineze sau să
                răspundă.
              </B>{" "}
              Autoritatea poate acționa din proprie inițiativă, dar nu este obligată.
            </P>
            <P>Dacă doriți ca sesizarea să poată fi urmărită și să primiți răspuns, creați-vă cont.</P>
          </Section>

          <Section id="drepturi" title="10. Drepturile dumneavoastră">
            <P>Aveți următoarele drepturi asupra datelor care vă privesc:</P>
            <List>
              <li>
                <B>Acces</B> — să aflați ce date deținem despre dumneavoastră și să primiți o copie.
              </li>
              <li>
                <B>Rectificare</B> — să corectați datele inexacte.
              </li>
              <li>
                <B>Ștergere</B> — să cereți ștergerea datelor dumneavoastră.
              </li>
              <li>
                <B>Restricționare</B> — să cereți suspendarea prelucrării cât timp contestați exactitatea sau
                legalitatea acesteia.
              </li>
              <li>
                <B>Portabilitate</B> — să primiți datele într-un format structurat, lizibil automat.
              </li>
              <li>
                <B>Opoziție</B> — să vă opuneți prelucrării întemeiate pe interesul legitim.
              </li>
              <li>
                <B>Retragerea consimțământului</B>, în orice moment, fără ca aceasta să afecteze legalitatea prelucrării
                efectuate anterior.
              </li>
            </List>
            <Sub>Cum le exercitați</Sub>
            <P>
              Două dintre acestea funcționează direct din aplicație, din{" "}
              <Link href="/profile" className={linkClass}>
                pagina contului dumneavoastră
              </Link>
              :
            </P>
            <List>
              <li>
                <B>Descărcarea datelor</B> — un fișier cu tot ce deținem: contul, sesizările cu locația exactă,
                istoricul lor și sesiunile deschise.
              </li>
              <li>
                <B>Ștergerea contului</B> — contul, sesiunile și linkurile de resetare dispar definitiv.
                <span className="mt-1.5 block">
                  <B>Important:</B> sesizările trimise <B>rămân</B> la primărie, fără nicio legătură cu dumneavoastră.
                  Ele devin anonime, iar pinul rămâne pe hartă. Nu le mai putem lega de dumneavoastră nici noi, nici
                  altcineva — prin urmare nu le mai putem nici identifica ulterior, la cerere.
                </span>
              </li>
            </List>
            <P>Pentru celelalte drepturi, scrieți-ne la adresa de la secțiunea 1.</P>
            <P>
              <B>Termen de răspuns:</B> în cel mult 30 de zile calendaristice de la primirea cererii. Dacă cererea este
              complexă, vă anunțăm în acest interval și vă explicăm motivul prelungirii.
            </P>
          </Section>

          <Section id="plangere" title="11. Dacă aveți o plângere">
            <P>
              Vă puteți adresa oricând Centrului Național pentru Protecția Datelor cu Caracter Personal (CNPDCP),
              autoritatea de supraveghere din Republica Moldova.
            </P>
            <P>Ne-ar ajuta însă dacă ne scrieți întâi nouă — de obicei putem rezolva problema mai repede direct.</P>
          </Section>

          <Section id="primarie" title="12. Ce se schimbă dacă platforma va fi preluată de primărie">
            <P>
              Dacă Primăria Municipiului Chișinău va prelua platforma ca serviciu oficial, următoarele elemente se
              modifică, iar această politică va fi actualizată corespunzător:
            </P>
            <List>
              <li>
                <B>Operatorul de date devine primăria</B>, nu echipa de dezvoltare.
              </li>
              <li>
                <B>Temeiul juridic al prelucrării se schimbă</B> din consimțământ în îndeplinirea unei sarcini care
                servește un interes public — temei specific autorităților publice.
              </li>
              <li>
                <B>Sesizările devin petiții în sensul Codului administrativ</B>, cu termen legal de răspuns de 30 de
                zile calendaristice (prelungibil la 45, iar în cazuri complexe până la 90), cu obligația de a emite un
                răspuns formal și cu dreptul dumneavoastră de a contesta tăcerea administrativă în instanța de
                contencios administrativ.
              </li>
              <li>
                <B>Primăria va desemna un responsabil cu protecția datelor</B>, obligatoriu pentru autoritățile
                publice, ale cărui date de contact vor fi publicate aici.
              </li>
              <li>
                Va fi necesară o <B>evaluare a impactului asupra protecției datelor</B>, obligatorie pentru platformele
                care prelucrează imagini din spațiul public și date de localizare.
              </li>
            </List>
          </Section>

          <Section id="modificari" title="13. Modificări ale acestei politici">
            <P>
              Dacă modificăm această politică, publicăm versiunea nouă pe această pagină și actualizăm data de la
              început. Pentru modificări importante, anunțăm utilizatorii cu cont prin e-mail.
            </P>
          </Section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
