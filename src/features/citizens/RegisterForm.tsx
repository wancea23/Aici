"use client";

import { useCallback, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide";
import AltchaWidget from "@/ui/AltchaWidget";
import Icon from "@/ui/Icon";
import PasswordChecklist from "@/features/citizens/PasswordChecklist";
import { sendJson } from "@/ui/api";
import { inputClass, labelClass, linkClass, primaryButton } from "@/ui/themed-styles";
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
  const [reveal, setReveal] = useState(false);

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
      <div className="space-y-3 font-body-sm text-body-sm text-on-surface-variant">
        <p className="rounded-lg bg-primary/10 p-space-md text-primary">
          Ți-am trimis un link la <span className="break-all font-medium">{sentTo}</span>.
        </p>
        <p>Deschide-l în 24 de ore ca să confirmi contul.</p>
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
    <form onSubmit={submit} className="flex flex-col gap-space-md">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClass}>
          Email address
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="new-password" className={labelClass}>
            Password
          </label>
          <span className="font-label-md text-label-md text-primary">Strong required</span>
        </div>
        <div className="relative flex items-center">
          <Icon node={Lock} className="pointer-events-none absolute left-3 h-4 w-4 text-outline" />
          <input
            id="new-password"
            type={reveal ? "text" : "password"}
            autoComplete="new-password"
            required
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pl-10 pr-11`}
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
          Repeat password
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

      <AltchaWidget key={widgetKey} onPayload={onAltcha} />

      {error && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={`${primaryButton} flex items-center justify-center gap-space-xs`}>
        <span>{busy ? "Se trimite..." : "Create account"}</span>
        {!busy && <Icon node={ArrowRight} className="h-[18px] w-[18px]" />}
      </button>
    </form>
  );
}
