import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BellRing, Route, ShieldCheck } from "lucide";
import Icon from "@/ui/Icon";
import RegisterForm from "@/features/citizens/RegisterForm";
import { linkClass } from "@/ui/themed-styles";
import { currentCitizen } from "@/features/citizens/session";

export const metadata: Metadata = { title: "Creează cont" };

// Three genuinely real things the app does today, not marketing stats — see the redesign
// plan's "real-data substitutions" table for what this replaced and why.
const features = [
  {
    icon: Route,
    title: "Urmărești evoluția sesizării tale, pas cu pas",
    body: "Fiecare schimbare de statut și fiecare mesaj de la primărie apar direct în contul tău.",
  },
  {
    icon: BellRing,
    title: "Primești un email la fiecare actualizare",
    body: "Nu trebuie să revii pe site ca să verifici — te anunțăm noi când primăria schimbă statutul.",
  },
  {
    icon: ShieldCheck,
    title: "Fotografiile tale sunt curățate automat",
    body: "Scoatem locația GPS și datele EXIF, iar fețele și numerele de înmatriculare sunt blurate înainte să ajungă publice.",
  },
];

export default async function RegisterPage() {
  if (await currentCitizen()) redirect("/profile");

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-surface px-margin py-space-2xl">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-xl bg-surface-container-lowest shadow-md lg:grid-cols-2">
        {/* Info panel — hidden on mobile, the form alone is the whole mobile flow */}
        <div className="hidden flex-col justify-center gap-space-lg bg-surface-container-low p-space-xl lg:flex">
          <div>
            <span className="inline-flex items-center rounded-full bg-secondary-container px-2.5 py-1 font-label-md text-label-md text-on-secondary-fixed">
              Primăria Municipiului Chișinău
            </span>
            <h1 className="mt-space-md font-headline-lg text-headline-lg text-on-surface">
              Vocea ta schimbă Chișinăul.
              <br />
              Creează un cont civic.
            </h1>
            <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant">
              Fiecare groapă semnalată, fiecare felinar reparat începe cu un cetățean implicat.
            </p>
          </div>

          <ul className="flex flex-col gap-space-md">
            {features.map((f) => (
              <li key={f.title} className="flex gap-space-sm rounded-lg bg-surface-container-lowest p-space-md">
                <Icon node={f.icon} className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-label-lg text-label-lg text-on-surface">{f.title}</p>
                  <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="flex flex-col p-space-lg lg:p-space-xl">
          <div className="mb-space-lg flex items-center justify-between gap-space-sm">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Create account</h2>
          </div>
          <p className="-mt-space-md mb-space-lg font-body-sm text-body-sm text-on-surface-variant">
            Îți trimitem un link pe email ca să confirmi adresa. Ai deja cont?{" "}
            <Link href="/sign-in" className={linkClass}>
              Conectează-te
            </Link>
            .
          </p>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
