import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/ui/SiteFooter";
import SiteHeader from "@/ui/SiteHeader";
import { linkClass } from "@/ui/themed-styles";

// Stub: no mockup exists for this screen. The text to put here is written and ready in
// docs/PRIVACY.md — use it as-is, don't rewrite the technical claims. A few spots in it are
// marked [DE COMPLETAT] and are still pending a decision; leave those visible.
export const metadata: Metadata = { title: "Confidențialitate" };

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-10">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-space-lg">
          <h1 className="font-headline-md text-headline-md text-on-surface">Politica de confidențialitate</h1>
          <p className="mt-space-sm font-body-sm text-body-sm text-on-surface-variant">
            Textul politicii urmează să fie scris. Până atunci, pe scurt: pozele sunt curățate de
            datele EXIF și de locația GPS înainte să fie salvate, fețele și numerele de
            înmatriculare sunt blurate automat, iar pe harta publică locația unei sesizări apare
            rotunjită la aproximativ 100 m. Pozele și descrierile se văd doar de către primărie și
            de cel care a trimis sesizarea.
          </p>
          <p className="mt-space-md font-body-sm text-body-sm text-outline">
            Îți poți descărca sau șterge datele oricând din{" "}
            <Link href="/profile" className={linkClass}>
              contul tău
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
