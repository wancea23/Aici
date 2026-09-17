"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/ui/api";
import { inputClass, labelClass, secondaryButton } from "@/ui/styles";
import { formatDate } from "@/ui/format";
import type { StaffListItem } from "@/features/staff/accounts";

type Role = StaffListItem["role"];
type Action = "deactivate" | "reactivate" | "role" | "force_reset" | "reset_link";

const roleNames: Record<Role, string> = { operator: "Operator", admin: "Administrator" };
const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";
const small = "rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:border-slate-400 disabled:opacity-50";

const confirmText: Partial<Record<Action, string>> = {
  deactivate: "Dezactivezi contul? Toate sesiunile lui se închid imediat.",
  force_reset: "Contul va trebui să aleagă o parolă nouă după autentificare. Sesiunile active se închid.",
};

export default function StaffAdmin({ staff, selfId }: { staff: StaffListItem[]; selfId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("operator");
  const [link, setLink] = useState<{ note: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLink(null);
    setBusy(true);
    const res = await sendJson("/api/admin/staff", { email, role });
    setBusy(false);
    if (!res.ok || !res.data.link) return setError(res.data.error ?? "A apărut o eroare.");
    setLink({
      note: `Invitație pentru ${email}. Trimite linkul persoanei. Expiră în 48 de ore și merge o singură dată.`,
      url: res.data.link,
    });
    setCopied(false);
    setEmail("");
  }

  async function act(member: StaffListItem, action: Action, newRole?: Role) {
    const question =
      action === "role"
        ? `Schimbi rolul contului ${member.email} în ${roleNames[newRole ?? "operator"]}? Sesiunile active se închid.`
        : confirmText[action];
    if (question && !window.confirm(question)) return;

    setError(null);
    setLink(null);
    setBusy(true);
    const res = await sendJson(`/api/admin/staff/${member.id}`, { action, role: newRole });
    setBusy(false);
    if (!res.ok) return setError(res.data.error ?? "A apărut o eroare.");
    if (res.data.link) {
      setLink({
        note: `Link de resetare pentru ${member.email}. Expiră în 15 minute și merge o singură dată.`,
        url: res.data.link,
      });
      setCopied(false);
    }
    router.refresh();
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className={card}>
        <h2 className="font-semibold">Invită un angajat</h2>
        <form onSubmit={invite} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1">
            <label htmlFor="invite-email" className={labelClass}>
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="invite-role" className={labelClass}>
              Rol
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className={inputClass}
            >
              <option value="operator">Operator</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <button type="submit" disabled={busy} className={secondaryButton}>
            Creează invitația
          </button>
        </form>
      </section>

      {link && (
        <div className="rounded-2xl border border-brand-500/40 bg-brand-50 p-4">
          <p className="text-sm text-brand-800">{link.note}</p>
          <div className="mt-3 flex gap-2">
            <input
              readOnly
              value={link.url}
              onFocus={(e) => e.target.select()}
              aria-label="Link"
              className={`${inputClass} bg-white font-mono text-xs`}
            />
            <button type="button" onClick={copy} className={secondaryButton}>
              {copied ? "Copiat" : "Copiază"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <section className={card}>
        <h2 className="font-semibold">Personal</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Rol</th>
                <th className="py-2 pr-4 font-medium">Stare</th>
                <th className="py-2 pr-4 font-medium">Ultima intrare</th>
                <th className="py-2 font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((m) => {
                const self = m.id === selfId;
                return (
                  <tr key={m.id} className="align-middle">
                    <td className="break-all py-3 pr-4">
                      {m.email}
                      {self && <span className="ml-2 text-xs text-slate-400">(tu)</span>}
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={m.role}
                        disabled={self || busy}
                        onChange={(e) => act(m, "role", e.target.value as Role)}
                        aria-label={`Rolul pentru ${m.email}`}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-60"
                      >
                        <option value="operator">Operator</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      {m.isActive ? "Activ" : <span className="text-red-600">Dezactivat</span>}
                      {m.forceReset && <span className="block text-xs text-amber-700">parolă nouă cerută</span>}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-slate-500">
                      {m.lastLogin ? formatDate(m.lastLogin) : "niciodată"}
                    </td>
                    <td className="py-3">
                      {self ? (
                        <span className="text-xs text-slate-400">din Contul meu</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {m.isActive && (
                            <button type="button" disabled={busy} onClick={() => act(m, "reset_link")} className={small}>
                              Link resetare
                            </button>
                          )}
                          <button type="button" disabled={busy} onClick={() => act(m, "force_reset")} className={small}>
                            Cere parolă nouă
                          </button>
                          {m.isActive ? (
                            <button type="button" disabled={busy} onClick={() => act(m, "deactivate")} className={small}>
                              Dezactivează
                            </button>
                          ) : (
                            <button type="button" disabled={busy} onClick={() => act(m, "reactivate")} className={small}>
                              Reactivează
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
