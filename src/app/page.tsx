import Link from "next/link";
import ReportForm from "@/components/ReportForm";
import { currentCitizen } from "@/lib/auth/citizen-session";

export default async function Home() {
  const citizen = await currentCitizen();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-10">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-semibold tracking-tight text-brand-700">Aici</span>
          <nav className="flex items-center gap-4 text-sm text-slate-500">
            <Link
              href={citizen ? "/profil" : "/conectare"}
              className="rounded-lg border border-brand-600 px-3 py-1.5 font-medium text-brand-700 hover:bg-brand-50"
            >
              {citizen ? "Contul meu" : "Conectare"}
            </Link>
            <Link href="/panou" className="hover:text-slate-800">
              Panou primărie
            </Link>
          </nav>
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
