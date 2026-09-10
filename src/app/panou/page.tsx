import Link from "next/link";
import sql from "@/lib/db";
import { categoryLabels, type Category } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  category: string;
  description: string;
  status: string;
  lat: number;
  lng: number;
  created_at: string;
};

export default async function Panou() {
  const rows = (await sql`
    select id, category, description, status,
           ST_Y(geom) as lat, ST_X(geom) as lng, created_at
    from reports
    order by created_at desc
    limit 100
  `) as unknown as Row[];

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <span className="text-2xl font-semibold tracking-tight text-brand-700">Aici</span>
          <p className="text-sm text-slate-500">Panou primărie</p>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          Raportează
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="text-slate-500">Nicio sesizare încă.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <img src={`/api/media/${r.id}`} alt="" className="h-44 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {categoryLabels[r.category as Category] ?? r.category}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {r.status}
                  </span>
                </div>
                {r.description && <p className="mt-1 text-sm text-slate-600">{r.description}</p>}
                <p className="mt-2 text-xs text-slate-400">
                  {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
