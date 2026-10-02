import type { Metadata } from "next";
import StaffShell from "@/features/staff/StaffShell";
import { requireStaffPage } from "@/features/staff/dal";

// Stub: no mockup exists for this screen. The staff sidebar in the mockups has a "Report"
// item, but what belongs here was never designed — exports? statistics? Ask Andrei.
// Not in the staff menu yet, on purpose: it's an empty page. See docs/SCREENS.md.
export const metadata: Metadata = { title: "Rapoarte" };

export default async function StaffReportsPage() {
  const { user } = await requireStaffPage("/reports");

  return (
    <StaffShell user={user} title="Rapoarte">
      <section className="mx-auto max-w-2xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Încă nimic aici</h2>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Pagina există ca să fie gata când se decide ce conține: export de date, statistici
          pe categorii, sau altceva. Deocamdată nu e legată în meniu.
        </p>
      </section>
    </StaffShell>
  );
}
