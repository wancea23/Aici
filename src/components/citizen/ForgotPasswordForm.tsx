"use client";

import { useCallback, useState } from "react";
import AltchaWidget from "@/components/auth/AltchaWidget";
import { sendJson } from "@/components/auth/api";
import { inputClass, labelClass, linkClass, primaryButton } from "@/components/auth/ui";

export default function ForgotPasswordForm({ minutes }: { minutes: number }) {
  const [email, setEmail] = useState("");
  const [altcha, setAltcha] = useState<string | null>(null);
  // a solved puzzle works once, so the widget is remounted after every attempt
  const [widgetKey, setWidgetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onAltcha = useCallback((payload: string | null) => {
    setAltcha(payload);
    if (payload) setError(null);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!altcha) return setError("Bifează verificarea de mai jos.");

    setBusy(true);
    const res = await sendJson("/api/citizen/forgot", { email, altcha });
    setBusy(false);
    setAltcha(null);
    setWidgetKey((k) => k + 1);

    if (res.ok) return setSentTo(email.trim().toLowerCase());
    setError(res.data.error ?? "A apărut o eroare.");
  }

  // Worded the same whether or not the address has an account.
  if (sentTo) {
    return (
      <div className="space-y-3 text-sm text-slate-600">
        <p className="rounded-xl bg-brand-50 p-4 text-brand-800">
          Dacă <span className="break-all font-medium">{sentTo}</span> are un cont Aici, ți-am trimis un link.
        </p>
        <p>Deschide-l în {minutes} minute ca să alegi parola nouă.</p>
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

      <AltchaWidget key={widgetKey} onPayload={onAltcha} />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={primaryButton}>
        {busy ? "Se trimite..." : "Trimite linkul"}
      </button>
    </form>
  );
}
