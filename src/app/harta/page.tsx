import type { Metadata } from "next";
import Link from "next/link";
import PublicMap from "@/components/PublicMap";
import { listPublicReports } from "@/lib/reports";
import { publicDetails } from "@/lib/env";

export const metadata: Metadata = { title: "Harta sesizărilor" };
export const dynamic = "force-dynamic";

// Open to everyone, no account needed.
export default async function MapPage() {
  const details = publicDetails();
  const reports = await listPublicReports(details);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-2xl font-semibold tracking-tight text-brand-700">
            Aici
          </Link>
          <p className="text-sm text-slate-500">Harta sesizărilor</p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Raportează o problemă
        </Link>
      </header>

      <PublicMap reports={reports} details={details} />

      <p className="mt-3 text-xs text-slate-400">
        {reports.length === 0 ? "Nicio sesizare încă. " : ""}
        Locațiile sunt aproximative, cam 100 m.
        {details ? "" : " Pozele și descrierile le vede doar primăria."}
      </p>
    </main>
  );
}
