import Link from "next/link";
import ReportForm from "@/components/ReportForm";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-10">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-semibold tracking-tight text-brand-700">Aici</span>
          <Link href="/panou" className="text-sm text-slate-500 hover:text-slate-800">
            Panou primărie
          </Link>
        </div>
        <p className="mt-1 text-slate-500">See it. Report it. Fix it.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Raportează o problemă</h1>
        <p className="mt-1 text-sm text-slate-500">Fă o poză, iar locația se adaugă singură.</p>
        <div className="mt-5">
          <ReportForm />
        </div>
      </section>
    </main>
  );
}
