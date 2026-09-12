import Link from "next/link";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
      <header className="mb-8">
        <Link href="/" className="text-2xl font-semibold tracking-tight text-brand-700">
          Aici
        </Link>
        <p className="mt-1 text-slate-500">Acces pentru personalul primăriei</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </section>
    </main>
  );
}
