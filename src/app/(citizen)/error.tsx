"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RefreshCw, ServerCrash } from "lucide";
import Icon from "@/ui/Icon";

// Shown instead of Next's error page when a citizen page fails on the server, like the map when
// the database refuses the connection. In production the message is hidden, only the digest
// comes through, and it matches the line in the server log.
export default function CitizenError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-surface px-5">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-space-lg text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-container text-on-error-container">
          <Icon node={ServerCrash} className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-headline-md text-headline-md text-on-surface">Nu am putut încărca pagina</h1>
        <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
          Serverul nu răspunde acum. Încearcă din nou peste câteva momente. Sesizările tale sunt în siguranță.
        </p>
        <div className="mt-space-lg flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 px-5 font-label-lg text-label-lg text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.99]"
          >
            <Icon node={RefreshCw} className="h-4 w-4" />
            Încearcă din nou
          </button>
          <Link href="/" className="rounded font-label-lg text-label-lg text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Înapoi la pagina principală
          </Link>
        </div>
        {error.digest && (
          <p className="mt-space-lg font-mono text-[11px] text-on-surface-variant">Cod eroare: {error.digest}</p>
        )}
      </div>
    </main>
  );
}
