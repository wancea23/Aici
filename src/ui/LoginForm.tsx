"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide";
import AltchaWidget from "@/ui/AltchaWidget";
import Icon from "@/ui/Icon";
import { sendJson } from "@/ui/api";
import { inputClass, labelClass, primaryButton } from "@/ui/themed-styles";

// Both logins use it: staff post to /api/auth/login, citizens to /api/citizen/login.
export default function LoginForm({
  next,
  endpoint = "/api/auth/login",
  children,
}: {
  next: string;
  endpoint?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState(false);
  const [altcha, setAltcha] = useState<string | null>(null);
  // a solved puzzle works once, so the widget is remounted after every attempt
  const [widgetKey, setWidgetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState(false);

  const onAltcha = useCallback((payload: string | null) => {
    setAltcha(payload);
    if (payload) setError(null);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (challenge && !altcha) return setError("Bifează verificarea de mai jos.");

    setBusy(true);
    const res = await sendJson(endpoint, { email, password, next, altcha: altcha ?? undefined });
    if (res.ok && res.data.next) {
      router.push(res.data.next);
      router.refresh();
      return;
    }
    setBusy(false);
    setError(res.data.error ?? "A apărut o eroare.");
    if (res.data.challenge) setChallenge(true);
    if (challenge || res.data.challenge) {
      setAltcha(null);
      setWidgetKey((k) => k + 1);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-space-md">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={labelClass}>
          Parolă
        </label>
        <div className="relative flex items-center">
          <input
            id="password"
            type={reveal ? "text" : "password"}
            autoComplete="current-password"
            required
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
      </div>

      {challenge && <AltchaWidget key={widgetKey} onPayload={onAltcha} />}

      {error && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={`${primaryButton} flex items-center justify-center gap-space-xs`}>
        <span>{busy ? "Se verifică..." : "Intră"}</span>
        {!busy && <Icon node={ArrowRight} className="h-[18px] w-[18px]" />}
      </button>

      {children}
    </form>
  );
}
