import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import ThemeToggle from "@/ui/ThemeToggle";
import "./globals.css";

// latin-ext carries the diacritics Romanian text needs (ă, â, î, ș, ț).
const sans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

// Used for reference codes and coordinates — tabular, slashed-zero numerals so they don't
// jitter or get misread at a glance.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aici",
  description: "See it. Report it. Fix it.",
};

// Sets the dark/light class on <html> before first paint, from whatever ThemeToggle last
// saved — without this, the page would flash light and then snap to dark a moment later.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("aici-theme");
    if (stored === "dark") document.documentElement.classList.add("dark");
  } catch (_) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/*
        Deliberately NOT bg-background/text-on-background here. Every page not yet migrated
        to the redesign (home, map, profile, staff — everything outside Phase 1) still uses
        hardcoded light classes (bg-white, text-slate-*) with no dark: awareness. Body-level
        tokens would flip their *inherited* text/background to dark-mode values while their
        own hardcoded white cards stayed light, producing exactly the barely-readable mix
        a real screenshot caught: near-invisible labels, a randomly dark textarea. Each
        migrated screen (AuthCard, the sign-up two-column layout) already sets its own
        bg-surface explicitly on a min-h-screen <main>, so it's unaffected by this and looks
        right in both themes regardless. Un-migrated pages stay visually locked to light —
        the toggle simply does nothing visible there yet — until their own phase migrates them.
      */}
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
