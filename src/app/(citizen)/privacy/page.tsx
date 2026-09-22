import type { Metadata } from "next";
import Link from "next/link";
import { linkClass } from "@/ui/themed-styles";

// Stub: no mockup exists for this screen. The real policy text still has to be written —
// ask Andrei. See docs/SCREENS.md.
export const metadata: Metadata = { title: "Confidențialitate" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen w-full bg-surface">
      <div className="mx-auto flex w-full max-w-xl flex-col px-5 py-10">
        <header className="mb-space-lg">
          <Link href="/" className="font-headline-lg text-headline-lg tracking-tight text-primary">
            Aici
          </Link>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">Confidențialitate</p>
        </header>

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
      </div>
    </main>
  );
}
