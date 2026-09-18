"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide";
import Icon from "@/ui/Icon";
import PasswordChecklist from "@/features/citizens/PasswordChecklist";
import { sendJson } from "@/ui/api";
import { inputClass, labelClass, linkClass, primaryButton } from "@/ui/themed-styles";
import { citizenPasswordChecks } from "@/features/citizens/password-rules";

export default function NewPasswordForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [reveal, setReveal] = useState(false);

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
      <div className="space-y-5 font-body-sm text-body-sm">
        <p className="rounded-lg bg-primary/10 p-space-md text-primary">
          Parola e schimbată. Te-am deconectat de pe toate dispozitivele.
        </p>
        <Link href="/sign-in" className={`${primaryButton} block text-center`}>
          Conectează-te
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-space-md">
      {/* lets password managers save the new password under the right account */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className={labelClass}>
          Parola nouă
        </label>
        <div className="relative flex items-center">
          <input
            id="new-password"
            type={reveal ? "text" : "password"}
            autoComplete="new-password"
            required
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Ascunde parola" : "Arată parola"}
            className="absolute right-0 flex h-11 w-11 items-center justify-center text-outline transition-colors hover:text-on-surface"
          >
            <Icon node={reveal ? EyeOff : Eye} className="h-5 w-5" />
          </button>
        </div>
        <PasswordChecklist password={password} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className={labelClass}>
          Repetă parola nouă
        </label>
        <input
          id="confirm-password"
          type={reveal ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
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
