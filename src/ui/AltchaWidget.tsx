"use client";

import { useEffect, useRef } from "react";
import type {} from "altcha/types/react";
// The external build ships its styles as a file instead of adding a <style> tag at runtime, which
// the Content-Security-Policy (src/server/security/csp.ts) would refuse.
import "altcha/altcha.css";

// Proof of work solved in the browser. Sign up always shows it, login only after repeated failures.
export default function AltchaWidget({ onPayload }: { onPayload: (payload: string | null) => void }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    // the widget registers a custom element, so it only loads in the browser
    import("altcha/external")
      .then(() => {
        // The external build has no workers of its own. The server's challenges use PBKDF2
        // (server/security/altcha.ts), solved by the worker served from src/app/altcha.
        for (const algorithm of ["PBKDF2/SHA-256", "PBKDF2/SHA-384", "PBKDF2/SHA-512"]) {
          globalThis.$altcha.algorithms.set(algorithm, () => new Worker("/altcha/pbkdf2.js"));
        }
        return import("altcha/i18n/ro");
      })
      .catch(() => {});

    const el = ref.current;
    if (!el) return;
    const onState = (e: Event) => {
      const { state, payload } = (e as CustomEvent<{ state: string; payload?: string }>).detail;
      onPayload(state === "verified" && payload ? payload : null);
    };
    el.addEventListener("statechange", onState);
    return () => el.removeEventListener("statechange", onState);
  }, [onPayload]);

  // altcha-widget renders in a shadow root, but standard CSS custom properties still pierce
  // that boundary — these are the widget's own documented theming hooks (see
  // node_modules/altcha/dist/external/altcha.css), mapped onto our own role tokens so it
  // repaints correctly under the dark/light toggle instead of staying stuck looking light.
  const theme = {
    "--altcha-color-base": "rgb(var(--color-surface-container-lowest))",
    "--altcha-color-base-content": "rgb(var(--color-on-surface))",
    "--altcha-color-neutral": "rgb(var(--color-surface-container-low))",
    "--altcha-color-neutral-content": "rgb(var(--color-on-surface-variant))",
    "--altcha-color-primary": "rgb(var(--color-primary))",
    "--altcha-color-primary-content": "rgb(var(--color-on-primary))",
    "--altcha-color-error": "rgb(var(--color-error))",
    "--altcha-color-error-content": "rgb(var(--color-on-error))",
    "--altcha-border-color": "rgb(var(--color-outline-variant))",
    // The stylesheet defines these on :root from light-dark() colours, which the CSS build can't
    // resolve there, so they come out empty (no checkbox border, a see-through checkbox) unless
    // they're set again here from the tokens above.
    "--altcha-checkbox-border-color": "rgb(var(--color-outline))",
    "--altcha-input-background-color": "rgb(var(--color-surface-container-lowest))",
    "--altcha-input-color": "rgb(var(--color-on-surface))",
    "--altcha-popover-color": "rgb(var(--color-outline-variant))",
    "--altcha-spinner-color": "rgb(var(--color-on-surface))",
    "--altcha-switch-background-color": "rgb(var(--color-surface-container-low))",
    "--altcha-switch-toggle-color": "rgb(var(--color-on-surface-variant))",
    "--altcha-border-radius": "0.5rem",
  } as React.CSSProperties;

  return (
    <div
      className="rounded-lg border border-outline-variant bg-surface-container-low px-space-md py-3"
      style={theme}
    >
      {/* a custom element is inline by default, which ignores the form's spacing */}
      <altcha-widget ref={ref} challenge="/api/auth/altcha" language="ro" style={{ display: "block" }} suppressHydrationWarning />
    </div>
  );
}
