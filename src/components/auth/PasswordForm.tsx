"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/components/auth/api";
import { inputClass, labelClass, primaryButton } from "@/components/auth/ui";

type Props = { email: string } & ({ mode: "change" } | { mode: "invite" | "reset"; token: string });

const MIN = 15;

export default function PasswordForm(props: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const length = [...password.normalize("NFKC")].length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (length < MIN) return setError(`Parola trebuie să aibă cel puțin ${MIN} caractere.`);
    if (password !== confirm) return setError("Parolele nu coincid.");

    setBusy(true);
    const res =
      props.mode === "change"
        ? await sendJson("/api/auth/password", { current, password })
        : await sendJson(props.mode === "invite" ? "/api/auth/invite" : "/api/auth/reset", {
            token: props.token,
            password,
          });

    if (res.ok && res.data.next) {
      router.push(res.data.next);
      router.refresh();
      return;
    }
    setBusy(false);
    setError(res.data.error ?? "A apărut o eroare.");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* lets password managers save the new password under the right account */}
      <input type="email" autoComplete="username" value={props.email} readOnly hidden />

      {props.mode === "change" && (
        <div>
          <label htmlFor="current" className={labelClass}>
            Parola actuală
          </label>
          <input
            id="current"
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label htmlFor="new-password" className={labelClass}>
          Parola nouă
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-400">
          Cel puțin {MIN} caractere ({length} acum). O frază din câteva cuvinte e ușor de ținut
          minte. Verificăm să nu apară în scurgeri de date publice.
        </p>
      </div>

      <div>
        <label htmlFor="confirm-password" className={labelClass}>
          Repetă parola nouă
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={primaryButton}>
        {busy ? "Se salvează..." : "Salvează parola"}
      </button>
    </form>
  );
}
