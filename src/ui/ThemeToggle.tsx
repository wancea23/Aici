"use client";

import { Moon, Sun } from "lucide";
import Icon from "@/ui/Icon";

const STORAGE_KEY = "aici-theme";

// Fixed in the top-left corner on every page (rendered once from the root layout), so it
// works even on pages with no header of their own. No React state: the inline script in
// layout.tsx already sets the right class before paint, this only ever flips it, and which
// icon shows is decided by CSS (dark:) reacting to that class — not a render-time guess at
// what the DOM already says, which is what tripped the set-state-in-effect lint rule earlier.
export default function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={() => {
        const dark = document.documentElement.classList.toggle("dark");
        try {
          localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
        } catch {
          // Private browsing / blocked storage — theme just won't persist across reloads.
        }
      }}
      aria-label="Comută între modul luminos și cel întunecat"
      className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface shadow-sm transition-colors hover:bg-surface-container-low"
    >
      <Icon node={Moon} className="h-5 w-5 dark:hidden" />
      <Icon node={Sun} className="hidden h-5 w-5 dark:block" />
    </button>
  );
}
