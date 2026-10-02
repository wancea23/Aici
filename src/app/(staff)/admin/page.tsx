import type { Metadata } from "next";
import { ScrollText, ShieldAlert, ShieldCheck, type IconNode } from "lucide";
import Icon from "@/ui/Icon";
import StaffShell from "@/features/staff/StaffShell";
import StaffAdmin from "@/features/staff/StaffAdmin";
import { requireStaffPage } from "@/features/staff/dal";
import { listAudit, listStaff } from "@/features/staff/accounts";
import { formatDate } from "@/ui/format";

export const metadata: Metadata = { title: "Administrare" };

// Action names start with their area, so the pill color says what kind of event it was
function actionTone(action: string) {
  if (action.startsWith("report.")) return "bg-primary/10 text-primary";
  if (action.startsWith("staff.")) return "bg-tertiary/10 text-tertiary";
  return "bg-surface-container text-on-surface";
}

export default async function AdminPage() {
  const { user } = await requireStaffPage("/admin", { role: "admin" });
  const [staff, log] = await Promise.all([listStaff(), listAudit(100)]);
  const active = staff.filter((m) => m.isActive).length;
  const failed = log.filter((e) => e.status !== "success").length;

  return (
    <StaffShell user={user} title="Administrare">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface sm:font-headline-lg sm:text-headline-lg">
              Personal și jurnal de audit
            </h2>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              Invită angajați, schimbă roluri și vezi tot ce s-a întâmplat în conturile primăriei.
            </p>
          </div>
          <div className="flex gap-3">
            <Stat icon={ShieldCheck} value={active} label={active === 1 ? "cont activ" : "conturi active"} />
            <Stat
              icon={ShieldAlert}
              value={failed}
              label={failed === 1 ? "eșuat în jurnal" : "eșuate în jurnal"}
              warn={failed > 0}
            />
          </div>
        </div>

        <StaffAdmin staff={staff} selfId={user.id} />

        <section className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
          <div className="flex items-start gap-3 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon node={ScrollText} className="h-5 w-5" />
            </span>
            <div>
              <h3 className="flex flex-wrap items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
                Jurnal de audit
                <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] font-medium text-on-surface-variant">
                  doar adăugare
                </span>
              </h3>
              <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                Ultimele 100 de evenimente. Baza de date nu permite modificarea sau ștergerea lor.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left font-body-sm text-body-sm">
              <thead className="bg-surface-container-low font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Când</th>
                  <th className="px-3 py-2.5 font-semibold">Cine</th>
                  <th className="px-3 py-2.5 font-semibold">Acțiune</th>
                  <th className="px-3 py-2.5 font-semibold">Asupra</th>
                  <th className="px-3 py-2.5 font-semibold">Rezultat</th>
                  <th className="px-3 py-2.5 font-semibold">IP</th>
                  <th className="px-5 py-2.5 font-semibold">Detalii</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {log.map((e) => {
                  const ok = e.status === "success";
                  return (
                    <tr key={e.id} className={`align-top ${ok ? "" : "bg-error-container/40"}`}>
                      <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-on-surface-variant">
                        {formatDate(e.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 text-on-surface">{e.actor ?? "necunoscut"}</td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded px-1.5 py-0.5 font-mono text-xs font-medium ${ok ? actionTone(e.action) : "bg-error/10 text-error"}`}>
                          {e.action}
                        </span>
                      </td>
                      <td className="max-w-[14rem] break-all px-3 py-2.5 text-on-surface">{e.target ?? ""}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            ok ? "bg-primary/10 text-primary" : "bg-error/10 text-error"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-primary" : "bg-error"}`} />
                          {ok ? "reușit" : "eșuat"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-on-surface-variant">{e.ip ?? ""}</td>
                      <td className="px-5 py-2.5 font-mono text-xs text-on-surface-variant">
                        {Object.keys(e.details).length ? JSON.stringify(e.details) : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </StaffShell>
  );
}

function Stat({ icon, value, label, warn = false }: { icon: IconNode; value: number; label: string; warn?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3">
      <Icon node={icon} className={`h-5 w-5 ${warn ? "text-error" : "text-primary"}`} />
      <div>
        <p className="font-headline-sm text-headline-sm leading-none text-on-surface">{value}</p>
        <p className="mt-1 font-label-md text-label-md text-on-surface-variant">{label}</p>
      </div>
    </div>
  );
}
