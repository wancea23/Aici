"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser";
import { sendJson } from "@/components/auth/api";
import LogoutButton from "@/components/auth/LogoutButton";
import { inputClass, labelClass, primaryButton, secondaryButton } from "@/components/auth/ui";

const noSubscribe = () => () => {};

export default function MfaChallenge({
  next,
  hasTotp,
  hasPasskey,
}: {
  next: string;
  hasTotp: boolean;
  hasPasskey: boolean;
}) {
  const router = useRouter();
  const webauthn = useSyncExternalStore(noSubscribe, browserSupportsWebAuthn, () => false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function finish(res: Awaited<ReturnType<typeof sendJson>>) {
    if (res.ok && res.data.next) {
      router.push(res.data.next);
      router.refresh();
      return;
    }
    setBusy(false);
    setError(res.data.error ?? "A apărut o eroare.");
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const method = recoveryMode || !hasTotp ? "recovery" : "totp";
    const res = await sendJson("/api/auth/mfa/verify", { method, code, next });
    setCode("");
    await finish(res);
  }

  async function signInWithPasskey() {
    setError(null);
    setBusy(true);
    const options = await sendJson("/api/auth/mfa/passkey/options", { purpose: "login" });
    if (!options.ok) return finish(options);
    try {
      const response = await startAuthentication({ optionsJSON: options.data as never });
      await finish(await sendJson("/api/auth/mfa/passkey/verify", { purpose: "login", response, next }));
    } catch {
      setBusy(false);
      setError("Verificarea cu cheia a fost anulată sau a expirat.");
    }
  }

  const showCode = hasTotp || recoveryMode;

  return (
    <div className="space-y-5">
      {hasPasskey && webauthn && (
        <button type="button" onClick={signInWithPasskey} disabled={busy} className={primaryButton}>
          Folosește cheia de acces
        </button>
      )}

      {showCode && (
        <form onSubmit={submitCode} className="space-y-3">
          <div>
            <label htmlFor="code" className={labelClass}>
              {recoveryMode ? "Cod de recuperare" : "Codul din aplicația de autentificare"}
            </label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoComplete="one-time-code"
              inputMode={recoveryMode ? "text" : "numeric"}
              placeholder={recoveryMode ? "XXXX-XXXX-XXXX-XXXX" : "123456"}
              className={`${inputClass} font-mono tracking-widest`}
            />
          </div>
          <button type="submit" disabled={busy} className={hasPasskey && webauthn ? secondaryButton : primaryButton}>
            {busy ? "Se verifică..." : "Confirmă"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
        <button
          type="button"
          onClick={() => {
            setRecoveryMode(!recoveryMode);
            setCode("");
            setError(null);
          }}
          className="text-brand-700 hover:underline"
        >
          {recoveryMode ? "Înapoi" : "Folosește un cod de recuperare"}
        </button>
        <LogoutButton />
      </div>
    </div>
  );
}
