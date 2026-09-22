import type { Metadata } from "next";
import StaffHeader from "@/features/staff/StaffHeader";
import { requireStaffPage } from "@/features/staff/dal";

// Stub: no mockup exists for this screen. The staff sidebar in the mockups has a "Report"
// item, but what belongs here was never designed — exports? statistics? Ask Andrei.
// Not linked from StaffHeader yet, on purpose: it's an empty page. See docs/SCREENS.md.
export const metadata: Metadata = { title: "Rapoarte" };

export default async function StaffReportsPage() {
  const { user } = await requireStaffPage("/reports");

  return (
    <main className="min-h-screen w-full bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <StaffHeader user={user} subtitle="Rapoarte" />
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Încă nimic aici</h2>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Pagina există ca să fie gata când se decide ce conține: export de date, statistici
            pe categorii, sau altceva. Deocamdată nu e legată în meniu.
          </p>
        </section>
      </div>
    </main>
  );
}
