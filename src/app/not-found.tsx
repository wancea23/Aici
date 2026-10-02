import type { Metadata } from "next";
import Link from "next/link";
import { MapPinOff } from "lucide";
import Icon from "@/ui/Icon";
import SiteFooter from "@/ui/SiteFooter";
import SiteHeader from "@/ui/SiteHeader";

export const metadata: Metadata = { title: "Pagina nu există" };

// Any URL that matches no route lands here, same card as the error screen
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-5 py-space-2xl">
        <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-space-lg text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-fixed">
            <Icon node={MapPinOff} className="h-6 w-6" />
          </div>
          <p className="mt-4 font-label-md text-label-md text-on-surface-variant">Eroare 404</p>
          <h1 className="mt-1 font-headline-md text-headline-md text-on-surface">Nu am găsit pagina asta</h1>
          <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
            Poate linkul e greșit sau pagina a fost mutată. Poți raporta o problemă sau te poți uita pe hartă.
          </p>
          <div className="mt-space-lg flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full bg-primary px-5 font-label-lg text-label-lg text-on-primary shadow-sm transition-all hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.99]"
            >
              Raportează o problemă
            </Link>
            <Link
              href="/map"
              className="rounded font-label-lg text-label-lg text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Vezi harta
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
