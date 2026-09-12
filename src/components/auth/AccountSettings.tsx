"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendJson } from "@/components/auth/api";
import MfaSetup from "@/components/auth/MfaSetup";
import RecoveryCodes from "@/components/auth/RecoveryCodes";
import { secondaryButton } from "@/components/auth/ui";
import { formatDate } from "@/lib/format";
import type { Factor } from "@/lib/auth/mfa";

const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

const typeLabels: Record<Factor["type"], string> = {
  webauthn: "Cheie de acces",
  totp: "Aplicație de autentificare",
};

export default function AccountSettings({
  email,
  role,
  factors,
  codesLeft,
}: {
  email: string;
  role: string;
  factors: Factor[];
  codesLeft: number;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function remove(factor: Factor) {
    if (!window.confirm(`Ștergi metoda „${factor.label}”?`)) return;
    setError(null);
    setBusy(true);
    const res = await sendJson(`/api/auth/mfa/${factor.id}`, undefined, "DELETE");
    setBusy(false);
    if (!res.ok) return setError(res.data.error ?? "A apărut o eroare.");
    router.refresh();
  }

  async function newCodes() {
    if (!window.confirm("Codurile de recuperare vechi nu vor mai funcționa. Continui?")) return;
    setError(null);
    setBusy(true);
    const res = await sendJson("/api/auth/mfa/recovery-codes");
    setBusy(false);
    if (!res.ok || !res.data.recoveryCodes) return setError(res.data.error ?? "A apărut o eroare.");
    setCodes(res.data.recoveryCodes);
  }

  return (
    <div className="space-y-6">
      <section className={card}>
        <h2 className="font-semibold">Date</h2>
        <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-slate-500">Email</dt>
          <dd className="break-all">{email}</dd>
          <dt className="text-slate-500">Rol</dt>
          <dd>{role}</dd>
        </dl>
        <Link href="/cont/parola" className={`${secondaryButton} mt-4 inline-block`}>
          Schimbă parola
        </Link>
      </section>

      <section className={card}>
        <h2 className="font-semibold">Verificare în doi pași</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {factors.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{f.label || typeLabels[f.type]}</p>
                <p className="text-xs text-slate-500">
                  {typeLabels[f.type]}, adăugată {formatDate(f.createdAt)}
                  {f.lastUsedAt ? `, folosită ultima dată ${formatDate(f.lastUsedAt)}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(f)}
                disabled={busy || factors.length === 1}
                title={factors.length === 1 ? "Adaugă altă metodă înainte să o ștergi pe aceasta" : undefined}
                className={secondaryButton}
              >
                Șterge
              </button>
            </li>
          ))}
        </ul>

        {adding ? (
          <div className="mt-4">
            <MfaSetup mode="extra" allowTotp={!factors.some((f) => f.type === "totp")} />
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="mt-3 text-sm text-slate-500 hover:text-slate-800"
            >
              Închide
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className={`${secondaryButton} mt-4`}>
            Adaugă o metodă
          </button>
        )}
      </section>

      <section className={card}>
        <h2 className="font-semibold">Coduri de recuperare</h2>
        {codes ? (
          <div className="mt-3">
            <RecoveryCodes
              codes={codes}
              continueLabel="Gata"
              onContinue={() => {
                setCodes(null);
                router.refresh();
              }}
            />
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              {codesLeft} din 10 coduri nefolosite.
              {codesLeft <= 3 && " Generează coduri noi cât mai ai acces."}
            </p>
            <button type="button" onClick={newCodes} disabled={busy} className={`${secondaryButton} mt-4`}>
              Generează coduri noi
            </button>
          </>
        )}
      </section>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
