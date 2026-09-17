"use client";

import { useEffect, useRef } from "react";
import type {} from "altcha/types/react";

// Proof of work solved in the browser. Sign up always shows it, login only after repeated failures.
export default function AltchaWidget({ onPayload }: { onPayload: (payload: string | null) => void }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    // the widget registers a custom element, so it only loads in the browser
    import("altcha").then(() => import("altcha/i18n/ro")).catch(() => {});

    const el = ref.current;
    if (!el) return;
    const onState = (e: Event) => {
      const { state, payload } = (e as CustomEvent<{ state: string; payload?: string }>).detail;
      onPayload(state === "verified" && payload ? payload : null);
    };
    el.addEventListener("statechange", onState);
    return () => el.removeEventListener("statechange", onState);
  }, [onPayload]);

  // a custom element is inline by default, which ignores the form's spacing
  return (
    <altcha-widget
      ref={ref}
      challenge="/api/auth/altcha"
      language="ro"
      style={{ display: "block" }}
      suppressHydrationWarning
    />
  );
}
