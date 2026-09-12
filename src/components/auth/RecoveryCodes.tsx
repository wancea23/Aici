"use client";

import { useState } from "react";
import { primaryButton, secondaryButton } from "@/components/auth/ui";

export default function RecoveryCodes({
  codes,
  onContinue,
  continueLabel = "Le-am salvat, continuă",
}: {
  codes: string[];
  onContinue: () => void;
  continueLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Coduri de recuperare pentru cazul în care pierzi telefonul sau cheia. Fiecare cod merge o
        singură dată. Păstrează-le într-un loc sigur, nu le vei mai vedea.
      </p>
      <ul className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-4 font-mono text-sm tracking-wide">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <button type="button" onClick={copy} className={secondaryButton}>
        {copied ? "Copiate" : "Copiază codurile"}
      </button>
      <button type="button" onClick={onContinue} className={primaryButton}>
        {continueLabel}
      </button>
    </div>
  );
}
