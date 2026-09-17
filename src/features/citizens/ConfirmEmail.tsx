"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AuthCard from "@/ui/AuthCard";
import { sendJson } from "@/ui/api";
import { linkClass, primaryButton } from "@/ui/styles";

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
        <p className="rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
          Adresa <span className="break-all font-medium">{email}</span> e confirmată. Contul tău e gata.
        </p>
        <Link href="/sign-in" className={`${primaryButton} mt-5 block text-center`}>
          Conectează-te
        </Link>
      </AuthCard>
    );
  }

  if (state.kind === "error") {
    return (
      <AuthCard audience="citizen" title="Nu am putut confirma">
        <p className="text-sm text-slate-600">{state.message}</p>
        <p className="mt-3 text-sm text-slate-600">
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
      <p className="text-sm text-slate-600">
        Confirmăm adresa <span className="break-all font-medium">{email}</span>...
      </p>
    </AuthCard>
  );
}
