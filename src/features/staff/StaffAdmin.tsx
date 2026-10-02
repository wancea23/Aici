"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Copy, Mail, UserPlus, Users, type IconNode } from "lucide";
import Icon from "@/ui/Icon";
import { sendJson } from "@/ui/api";
import { inputClass, labelClass } from "@/ui/themed-styles";
import { formatDate, initials } from "@/ui/format";
import type { StaffListItem } from "@/features/staff/accounts";

type Role = StaffListItem["role"];
type Action = "deactivate" | "reactivate" | "role" | "force_reset" | "reset_link";

const roleNames: Record<Role, string> = { operator: "Operator", admin: "Administrator" };
const card = "rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm";
const pillButton =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 font-label-lg text-label-lg text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.99] disabled:opacity-50";
const small =
  "rounded-md px-2 py-1 font-label-md text-label-md transition-colors disabled:opacity-50";
const quiet = "text-on-surface-variant hover:bg-surface-container hover:text-on-surface";
// its own class, not inputClass plus overrides, so the background and size don't fight
const linkField =
  "h-11 w-full rounded-lg border-none bg-surface-container-lowest px-space-md font-mono text-xs text-on-surface outline-none focus:ring-4 focus:ring-primary/10";

const confirmText: Partial<Record<Action, string>> = {
  deactivate: "Dezactivezi contul? Toate sesiunile lui se închid imediat.",
  force_reset: "Contul va trebui să aleagă o parolă nouă după autentificare. Sesiunile active se închid.",
};

function CardTitle({ icon, title, note }: { icon: IconNode; title: string; note: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon node={icon} className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
        <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{note}</p>
      </div>
    </div>
  );
}

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
      <section className={`${card} p-5`}>
        <CardTitle icon={UserPlus} title="Invită un angajat" note="Primește un link de o singură folosință, valabil 48 de ore." />
        <form onSubmit={invite} className="mt-5 flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1">
            <label htmlFor="invite-email" className={labelClass}>
              Email
            </label>
            <div className="relative flex items-center">
              <Icon node={Mail} className="pointer-events-none absolute left-3 h-4 w-4 text-outline" />
              <input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
          <div className="w-44">
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
          <button type="submit" disabled={busy} className={pillButton}>
            <Icon node={UserPlus} className="h-4 w-4" />
            Creează invitația
          </button>
        </form>

        {link && (
          <div className="mt-5 rounded-lg bg-surface-container-low p-4">
            <p className="flex gap-2 font-body-sm text-body-sm text-on-surface">
              <Icon node={CircleCheck} className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {link.note}
            </p>
            <div className="mt-3 flex gap-2">
              <input
                readOnly
                value={link.url}
                onFocus={(e) => e.target.select()}
                aria-label="Link"
                className={linkField}
              />
              <button type="button" onClick={copy} className={pillButton}>
                <Icon node={Copy} className="h-4 w-4" />
                {copied ? "Copiat" : "Copiază"}
              </button>
            </div>
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container">
          {error}
        </p>
      )}

      <section className={`${card} overflow-hidden`}>
        <div className="p-5">
          <CardTitle
            icon={Users}
            title="Personal"
            note={staff.length === 1 ? "Un cont de angajat." : `${staff.length} conturi de angajați.`}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left font-body-sm text-body-sm">
            <thead className="bg-surface-container-low font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Angajat</th>
                <th className="px-3 py-2.5 font-semibold">Rol</th>
                <th className="px-3 py-2.5 font-semibold">Stare</th>
                <th className="px-3 py-2.5 font-semibold">Ultima intrare</th>
                <th className="px-5 py-2.5 font-semibold">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {staff.map((m) => {
                const self = m.id === selfId;
                return (
                  <tr key={m.id} className="align-middle">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-label-md text-label-md ${
                            self ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface"
                          }`}
                        >
                          {initials(m.email)}
                        </span>
                        <span className={`whitespace-nowrap ${m.isActive ? "text-on-surface" : "text-on-surface-variant line-through"}`}>
                          {m.email}
                        </span>
                        {self && (
                          <span className="rounded bg-secondary-container px-1.5 py-0.5 font-label-md text-label-md text-on-secondary-fixed">
                            tu
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={m.role}
                        disabled={self || busy}
                        onChange={(e) => act(m, "role", e.target.value as Role)}
                        aria-label={`Rolul pentru ${m.email}`}
                        className="h-9 rounded-lg border-none bg-surface-container-low px-2 font-body-sm text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                      >
                        <option value="operator">Operator</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.isActive ? "bg-primary/10 text-primary" : "bg-error/10 text-error"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${m.isActive ? "bg-primary" : "bg-error"}`} />
                        {m.isActive ? "Activ" : "Dezactivat"}
                      </span>
                      {m.forceReset && (
                        <span className="mt-1 block text-xs text-amber-800 dark:text-amber-300">parolă nouă cerută</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-on-surface-variant">
                      {m.lastLogin ? formatDate(m.lastLogin) : "niciodată"}
                    </td>
                    <td className="px-5 py-3">
                      {self ? (
                        <span className="font-label-md text-label-md text-on-surface-variant">din Contul meu</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {m.isActive && (
                            <button type="button" disabled={busy} onClick={() => act(m, "reset_link")} className={`${small} ${quiet}`}>
                              Link resetare
                            </button>
                          )}
                          <button type="button" disabled={busy} onClick={() => act(m, "force_reset")} className={`${small} ${quiet}`}>
                            Cere parolă nouă
                          </button>
                          {m.isActive ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => act(m, "deactivate")}
                              className={`${small} text-error hover:bg-error/10`}
                            >
                              Dezactivează
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => act(m, "reactivate")}
                              className={`${small} bg-primary/10 text-primary hover:bg-primary/15`}
                            >
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
