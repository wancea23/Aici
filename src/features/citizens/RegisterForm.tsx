"use client";

import { useCallback, useState } from "react";
import AltchaWidget from "@/ui/AltchaWidget";
import PasswordChecklist from "@/features/citizens/PasswordChecklist";
import { sendJson } from "@/ui/api";
import { inputClass, labelClass, linkClass, primaryButton } from "@/ui/styles";
import { citizenPasswordChecks } from "@/features/citizens/password-rules";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [altcha, setAltcha] = useState<string | null>(null);
  // a solved puzzle works once, so the widget is remounted after every attempt
  const [widgetKey, setWidgetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const missing = citizenPasswordChecks(password).filter((check) => !check.ok);

  const onAltcha = useCallback((payload: string | null) => {
    setAltcha(payload);
    if (payload) setError(null);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (missing.length) {
      return setError(`Parola trebuie să aibă ${missing.map((check) => check.label).join(", ")}.`);
    }
    if (password !== confirm) return setError("Parolele nu coincid.");
    if (!altcha) return setError("Bifează verificarea de mai jos.");

    setBusy(true);
    const res = await sendJson("/api/citizen/register", { email, password, altcha });
    setBusy(false);
    setAltcha(null);
    setWidgetKey((k) => k + 1);

    if (res.ok) return setSentTo(email.trim().toLowerCase());
    setError(res.data.error ?? "A apărut o eroare.");
  }

  if (sentTo) {
    return (
      <div className="space-y-3 text-sm text-slate-600">
        <p className="rounded-xl bg-brand-50 p-4 text-brand-800">
          Ți-am trimis un link la <span className="break-all font-medium">{sentTo}</span>.
        </p>
        <p>Deschide-l în 24 de ore ca să confirmi contul.</p>
        <p className="text-xs text-slate-400">
          Nu a venit? Uită-te și în Spam, sau{" "}
          <button type="button" onClick={() => setSentTo(null)} className={linkClass}>
            trimite din nou
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="new-password" className={labelClass}>
          Parolă
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
          Repetă parola
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

      <AltchaWidget key={widgetKey} onPayload={onAltcha} />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={primaryButton}>
        {busy ? "Se trimite..." : "Creează contul"}
      </button>
    </form>
  );
}
