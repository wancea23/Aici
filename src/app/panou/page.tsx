import Link from "next/link";
import ReportsBoard from "@/components/ReportsBoard";
import { listReports } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function Panou() {
  const reports = await listReports();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-2xl font-semibold tracking-tight text-brand-700">Aici</span>
          <p className="text-sm text-slate-500">Panou primărie</p>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          Raportează
        </Link>
      </header>

      <ReportsBoard reports={reports} />
    </main>
  );
}
