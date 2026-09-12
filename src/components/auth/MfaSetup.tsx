"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { sendJson, type ApiResult } from "@/components/auth/api";
import RecoveryCodes from "@/components/auth/RecoveryCodes";
import { inputClass, labelClass, primaryButton, secondaryButton } from "@/components/auth/ui";

type TotpSetup = { id: string; qr: string; key: string };

const noSubscribe = () => () => {};

// "first" runs right after the first login, "extra" adds a factor from the account page.
export default function MfaSetup({
  mode,
  next = "/panou",
  allowTotp = true,
}: {
  mode: "first" | "extra";
  next?: string;
  allowTotp?: boolean;
}) {
  const router = useRouter();
  const webauthn = useSyncExternalStore(noSubscribe, browserSupportsWebAuthn, () => false);
  const [totp, setTotp] = useState<TotpSetup | null>(null);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [target, setTarget] = useState(next);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handle(res: ApiResult) {
    setBusy(false);
    if (!res.ok) {
      setError(res.data.error ?? "A apărut o eroare.");
      return;
    }
    if (res.data.recoveryCodes) {
      setCodes(res.data.recoveryCodes);
      setTarget(res.data.next ?? next);
      return;
    }
    setTotp(null);
    setCode("");
    setLabel("");
    setDone("Metoda a fost adăugată.");
    router.refresh();
  }

  async function addPasskey() {
    setError(null);
    setDone(null);
    setBusy(true);
    const options = await sendJson("/api/auth/mfa/passkey/options", { purpose: "register" });
    if (!options.ok) return handle(options);
    try {
      const response = await startRegistration({ optionsJSON: options.data as never });
      handle(
        await sendJson("/api/auth/mfa/passkey/verify", {
          purpose: "register",
          response,
          label: label || undefined,
          next,
        })
      );
    } catch {
      setBusy(false);
      setError("Înregistrarea cheii a fost anulată sau a expirat.");
    }
  }

  async function startTotp() {
    setError(null);
    setDone(null);
    setBusy(true);
    const res = await sendJson("/api/auth/mfa/totp");
    setBusy(false);
    if (!res.ok) return setError(res.data.error ?? "A apărut o eroare.");
    setTotp(res.data as unknown as TotpSetup);
  }

  async function confirmTotp(e: React.FormEvent) {
    e.preventDefault();
    if (!totp) return;
    setError(null);
    setBusy(true);
    handle(await sendJson("/api/auth/mfa/totp/confirm", { id: totp.id, code, next }));
  }

  if (codes) {
    return (
      <RecoveryCodes
        codes={codes}
        onContinue={() => {
          router.push(target);
          router.refresh();
        }}
      />
    );
  }

  const showPasskey = webauthn && !totp;

  return (
    <div className="space-y-4">
      {showPasskey && (
        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
          <p className="font-medium">Cheie de acces</p>
          <p className="text-sm text-slate-500">
            Recomandat. Folosești amprenta, fața sau PIN-ul telefonului ori al laptopului, sau o
            cheie de securitate USB.
          </p>
          {mode === "extra" && (
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={60}
              placeholder="Nume, de exemplu Laptop birou"
              aria-label="Numele cheii"
              className={inputClass}
            />
          )}
          <button type="button" onClick={addPasskey} disabled={busy} className={primaryButton}>
            Adaugă o cheie de acces
          </button>
        </div>
      )}

      {allowTotp && (
        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
          <p className="font-medium">Aplicație de autentificare</p>
          {!totp ? (
            <>
              <p className="text-sm text-slate-500">
                Google Authenticator, Microsoft Authenticator, Aegis sau altă aplicație care
                generează coduri de 6 cifre.
              </p>
              <button type="button" onClick={startTotp} disabled={busy} className={secondaryButton}>
                Configurează aplicația
              </button>
            </>
          ) : (
            <form onSubmit={confirmTotp} className="space-y-3">
              <p className="text-sm text-slate-500">
                Scanează codul QR cu aplicația, apoi scrie codul de 6 cifre pe care îl arată.
              </p>
              <Image
                src={totp.qr}
                alt="Cod QR pentru aplicația de autentificare"
                width={220}
                height={220}
                unoptimized
                className="mx-auto rounded-lg border border-slate-200"
              />
              <p className="text-center text-xs text-slate-500">
                Sau scrie cheia de mână:{" "}
                <span className="font-mono text-slate-700">{totp.key}</span>
              </p>
              <div>
                <label htmlFor="totp-code" className={labelClass}>
                  Cod
                </label>
                <input
                  id="totp-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  placeholder="123456"
                  className={`${inputClass} font-mono tracking-widest`}
                />
              </div>
              <button type="submit" disabled={busy} className={primaryButton}>
                {busy ? "Se verifică..." : "Confirmă"}
              </button>
            </form>
          )}
        </div>
      )}

      {!showPasskey && !allowTotp && (
        <p className="text-sm text-slate-500">Nu există alte metode disponibile pe acest dispozitiv.</p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {done && <p className="text-sm text-brand-700">{done}</p>}
    </div>
  );
}
