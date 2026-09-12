import type { Metadata } from "next";
import StaffHeader from "@/components/auth/StaffHeader";
import StaffAdmin from "@/components/auth/StaffAdmin";
import { requireStaffPage } from "@/lib/auth/dal";
import { listAudit, listStaff } from "@/lib/auth/staff";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Administrare" };

export default async function AdminPage() {
  const { user } = await requireStaffPage("/admin", { role: "admin" });
  const [staff, log] = await Promise.all([listStaff(), listAudit(100)]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <StaffHeader user={user} subtitle="Administrare" />
      <StaffAdmin staff={staff} selfId={user.id} />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Jurnal de audit</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ultimele 100 de evenimente. Baza de date nu permite modificarea sau ștergerea lor.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Când</th>
                <th className="py-2 pr-4 font-medium">Cine</th>
                <th className="py-2 pr-4 font-medium">Acțiune</th>
                <th className="py-2 pr-4 font-medium">Asupra</th>
                <th className="py-2 pr-4 font-medium">Rezultat</th>
                <th className="py-2 pr-4 font-medium">IP</th>
                <th className="py-2 font-medium">Detalii</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {log.map((e) => (
                <tr key={e.id} className="align-top">
                  <td className="whitespace-nowrap py-2 pr-4 text-slate-500">{formatDate(e.createdAt)}</td>
                  <td className="py-2 pr-4">{e.actor ?? "necunoscut"}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{e.action}</td>
                  <td className="max-w-[14rem] break-all py-2 pr-4">{e.target ?? ""}</td>
                  <td className="py-2 pr-4">
                    {e.status === "success" ? "reușit" : <span className="text-red-600">eșuat</span>}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-slate-500">{e.ip ?? ""}</td>
                  <td className="py-2 font-mono text-xs text-slate-500">
                    {Object.keys(e.details).length ? JSON.stringify(e.details) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
