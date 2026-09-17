"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, TriangleAlert } from "lucide";
import Icon from "@/ui/Icon";
import { sendJson } from "@/ui/api";
import { dangerButton, inputClass, labelClass, secondaryButton } from "@/ui/styles";
import { CONFIRM_WORD } from "@/features/citizens/confirm-word";

export default function AccountData() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await sendJson("/api/citizen/delete", { password, confirm });

    if (!res.ok) {
      setBusy(false);
      return setError(res.data.error ?? "A apărut o eroare.");
    }
    router.push("/");
    router.refresh();
  }

  return (
    <section className="mt-8 border-t border-slate-100 pt-6">
      <h2 className="text-sm font-semibold text-slate-900">Datele tale</h2>
      <p className="mt-1 text-sm text-slate-600">
        Descarcă tot ce are Aici despre tine: contul, sesizările cu locația exactă, istoricul lor și
        sesiunile deschise. Pozele rămân la linkurile din fișier, pe care doar tu le poți deschide.
      </p>
      <a href="/api/citizen/export" download className={`mt-3 inline-flex items-center gap-2 ${secondaryButton}`}>
        <Icon node={Download} className="h-4 w-4" />
        Descarcă datele mele
      </a>

      <div className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700">
          <Icon node={TriangleAlert} className="h-4 w-4" />
          Șterge contul
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Contul, sesiunile și linkurile de resetare dispar definitiv. Sesizările trimise rămân la
          primărie, care poate lucra la ele, dar fără nicio legătură cu tine.
        </p>

        {!open ? (
          <button type="button" onClick={() => setOpen(true)} className={`mt-3 inline-flex items-center gap-2 ${secondaryButton}`}>
            <Icon node={Trash2} className="h-4 w-4" />
            Vreau să șterg contul
          </button>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="delete-password" className={labelClass}>
                Parola ta
              </label>
              <input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="delete-confirm" className={labelClass}>
                Scrie {CONFIRM_WORD} ca să confirmi
              </label>
              <input
                id="delete-confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
                autoCapitalize="characters"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={busy} className={dangerButton}>
                {busy ? "Se șterge..." : "Șterge definitiv contul"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setPassword("");
                  setConfirm("");
                  setError(null);
                }}
                className={secondaryButton}
              >
                Renunță
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
