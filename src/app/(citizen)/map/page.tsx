import type { Metadata } from "next";
import { Info } from "lucide";
import Icon from "@/ui/Icon";
import SiteFooter from "@/ui/SiteFooter";
import SiteHeader from "@/ui/SiteHeader";
import PublicMap from "@/features/map/PublicMap";
import { listPublicReports } from "@/features/reports/queries";
import { publicDetails } from "@/server/env";

export const metadata: Metadata = { title: "Harta sesizărilor" };
export const dynamic = "force-dynamic";

// Open to everyone, no account needed.
export default async function MapPage() {
  const details = publicDetails();
  const reports = await listPublicReports(details);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <h1 className="sr-only">Harta sesizărilor</h1>
        <PublicMap reports={reports} details={details} />
        <div className="mx-auto flex w-full max-w-7xl items-start gap-2 px-4 py-4 sm:px-6">
          <Icon node={Info} className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Locațiile sunt aproximative, cam 100 m.
            {details ? "" : " Pozele și descrierile le vede doar primăria, ca să nu se afle cine a raportat."}
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
