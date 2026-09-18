"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleCheck, Mail as MailIcon, ShieldCheck } from "lucide";
import AuthCard from "@/ui/AuthCard";
import Icon from "@/ui/Icon";
import { sendJson } from "@/ui/api";
import { linkClass, primaryButton } from "@/ui/themed-styles";

type State = { kind: "busy" } | { kind: "done" } | { kind: "error"; message: string };

// Confirms as soon as the page opens. It happens in the browser, not while the server
// renders the page, so a mail scanner that only downloads the link confirms nothing.
export default function ConfirmEmail({ token, email }: { token: string; email: string }) {
  const [state, setState] = useState<State>({ kind: "busy" });
  // React runs effects twice in development, and the link works only once
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    sendJson("/api/citizen/verify", { token }).then((res) =>
      setState(res.ok ? { kind: "done" } : { kind: "error", message: res.data.error ?? "A apărut o eroare." })
    );
  }, [token]);

  if (state.kind === "done") {
    return (
      <AuthCard audience="citizen" title="Email verificat">
        <div className="mb-space-lg flex flex-col items-center rounded-lg bg-secondary-container/20 p-space-md text-center">
          <div className="mb-space-sm flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
            <Icon node={CircleCheck} className="h-7 w-7" />
          </div>
          <h2 className="mb-space-xs font-headline-sm text-headline-sm text-on-surface">Adresa ta e confirmată</h2>
          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            Adresa <span className="break-all font-code-sm text-code-sm text-primary">{email}</span> e confirmată.
            Contul tău e gata să urmărească sesizări și să primească actualizări de la primărie.
          </p>
        </div>

        <Link href="/sign-in" className={`${primaryButton} flex items-center justify-center gap-space-xs`}>
          <span>Conectează-te</span>
          <Icon node={ArrowRight} className="h-[18px] w-[18px]" />
        </Link>

        <div className="mt-space-lg flex items-start gap-space-xs rounded-lg bg-surface-container-low p-space-sm text-left">
          <Icon node={ShieldCheck} className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="font-label-md text-label-md leading-normal text-on-surface-variant">
            Conturile confirmate primesc email de fiecare dată când primăria actualizează o sesizare.
          </p>
        </div>
      </AuthCard>
    );
  }

  if (state.kind === "error") {
    return (
      <AuthCard audience="citizen" title="Nu am putut confirma">
        <p className="font-body-sm text-body-sm text-on-surface-variant">{state.message}</p>
        <p className="mt-space-sm font-body-sm text-body-sm text-on-surface-variant">
          <Link href="/sign-in" className={linkClass}>
            Conectează-te
          </Link>{" "}
          dacă ai confirmat deja, sau{" "}
          <Link href="/sign-up" className={linkClass}>
            înregistrează-te din nou
          </Link>{" "}
          ca să primești alt link.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard audience="citizen" title="Se confirmă emailul">
      <p className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface-variant">
        <Icon node={MailIcon} className="h-4 w-4 shrink-0 animate-pulse text-primary" />
        Confirmăm adresa <span className="break-all font-medium">{email}</span>...
      </p>
    </AuthCard>
  );
}
