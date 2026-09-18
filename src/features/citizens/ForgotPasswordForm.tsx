"use client";

import { useCallback, useState } from "react";
import { Clock, Mail, Send } from "lucide";
import AltchaWidget from "@/ui/AltchaWidget";
import Icon from "@/ui/Icon";
import { sendJson } from "@/ui/api";
import { inputClass, labelClass, linkClass, primaryButton } from "@/ui/themed-styles";

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
      <div className="space-y-3 font-body-sm text-body-sm text-on-surface-variant">
        <p className="rounded-lg bg-primary/10 p-space-md text-primary">
          Dacă <span className="break-all font-medium">{sentTo}</span> are un cont Aici, ți-am trimis un link.
        </p>
        <p>Deschide-l în {minutes} minute ca să alegi parola nouă.</p>
        <p className="font-body-sm text-body-sm text-outline">
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
    <>
      <form onSubmit={submit} className="flex flex-col gap-space-md">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <div className="relative flex items-center">
            <Icon node={Mail} className="pointer-events-none absolute left-3 h-4 w-4 text-outline" />
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <AltchaWidget key={widgetKey} onPayload={onAltcha} />

        {error && (
          <p role="alert" className="font-body-sm text-body-sm text-error">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={`${primaryButton} flex items-center justify-center gap-space-xs`}>
          <Icon node={Send} className="h-[18px] w-[18px]" />
          <span>{busy ? "Se trimite..." : "Trimite linkul"}</span>
        </button>
      </form>

      <p className="mt-space-md flex items-center justify-center gap-1 font-body-sm text-body-sm text-outline">
        <Icon node={Clock} className="h-4 w-4" />
        Linkul e valabil {minutes} minute.
      </p>
    </>
  );
}
