import Link from "next/link";
import ReportForm from "@/features/reports/ReportForm";
import { linkClass } from "@/ui/themed-styles";
import { currentCitizen } from "@/features/citizens/session";

export default async function Home() {
  const citizen = await currentCitizen();

  return (
    <main className="min-h-screen w-full bg-surface">
      <div className="mx-auto flex w-full max-w-xl flex-col px-5 py-10">
        <header className="mb-space-lg">
          <div className="flex items-center justify-between gap-3">
            <span className="font-headline-lg text-headline-lg tracking-tight text-primary">Aici</span>
            <nav className="flex flex-wrap items-center justify-end gap-x-space-md gap-y-2 font-body-sm text-body-sm text-on-surface-variant">
              <Link href="/map" className="transition-colors hover:text-on-surface">
                Harta
              </Link>
              <Link href="/dashboard" className="transition-colors hover:text-on-surface">
                Panou primărie
              </Link>
              <Link
                href={citizen ? "/profile" : "/sign-in"}
                className="rounded-lg border border-primary px-3 py-1.5 font-label-lg text-label-lg text-primary transition-colors hover:bg-primary/10"
              >
                {citizen ? "Contul meu" : "Conectare"}
              </Link>
            </nav>
          </div>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">See it. Report it. Fix it.</p>
        </header>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-space-lg shadow-sm">
          <h1 className="font-headline-md text-headline-md text-on-surface">Raportează o problemă</h1>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Fă o poză, iar locația se adaugă singură. O poți muta pe hartă.
          </p>
          <div className="mt-space-lg">
            <ReportForm />
          </div>
        </section>

        <Link href="/map" className={`mt-space-md text-center ${linkClass}`}>
          Vezi pe hartă ce au raportat alții
        </Link>
      </div>
    </main>
  );
}
