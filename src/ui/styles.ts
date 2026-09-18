// Theme-blind on purpose: shared by every page that hasn't been redesigned against the new
// design system yet (see themed-styles.ts for the token-based versions Phase 1 screens use).
// Making this file itself dark-aware once made every un-migrated page partially react to the
// dark toggle — e.g. a form input going dark while its own label and card stayed hardcoded
// light. Keep these fixed until each consumer's own phase migrates it to themed-styles.ts.
export const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition-shadow " +
  "focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

export const primaryButton =
  "w-full rounded-lg bg-brand-600 py-3 font-medium text-white shadow-sm transition-colors " +
  "hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50";

export const secondaryButton =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors " +
  "hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50";

export const dangerButton =
  "rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors " +
  "hover:bg-red-700 active:bg-red-800 disabled:opacity-50";

export const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export const linkClass = "font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline";
