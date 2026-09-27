import Link from "next/link";
import ReportForm from "@/features/reports/ReportForm";
import SiteFooter from "@/ui/SiteFooter";
import SiteHeader from "@/ui/SiteHeader";
import { linkClass } from "@/ui/themed-styles";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-10">
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
      </main>
      <SiteFooter />
    </div>
  );
}
