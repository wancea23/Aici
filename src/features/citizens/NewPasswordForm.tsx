"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordChecklist from "@/features/citizens/PasswordChecklist";
import { sendJson } from "@/ui/api";
import { inputClass, labelClass, linkClass, primaryButton } from "@/ui/styles";
import { citizenPasswordChecks } from "@/features/citizens/password-rules";

export default function NewPasswordForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const missing = citizenPasswordChecks(password).filter((check) => !check.ok);
    if (missing.length) {
      return setError(`Parola trebuie să aibă ${missing.map((check) => check.label).join(", ")}.`);
    }
    if (password !== confirm) return setError("Parolele nu coincid.");

    setBusy(true);
    const res = await sendJson("/api/citizen/reset", { token, password });
    setBusy(false);

    if (res.ok) return setDone(true);
    setError(res.data.error ?? "A apărut o eroare.");
    setExpired(res.data.error?.includes("nu mai este valabil") ?? false);
  }

  if (done) {
    return (
      <div className="space-y-5 text-sm">
        <p className="rounded-xl bg-brand-50 p-4 text-brand-800">
          Parola e schimbată. Te-am deconectat de pe toate dispozitivele.
        </p>
        <Link href="/sign-in" className={`${primaryButton} block text-center`}>
          Conectează-te
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* lets password managers save the new password under the right account */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />

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
        <PasswordChecklist password={password} />
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
          {expired && (
            <>
              {" "}
              <Link href="/forgot-password" className={linkClass}>
                Cere un link nou
              </Link>
              .
            </>
          )}
        </p>
      )}

      <button type="submit" disabled={busy} className={primaryButton}>
        {busy ? "Se salvează..." : "Salvează parola"}
      </button>
    </form>
  );
}
