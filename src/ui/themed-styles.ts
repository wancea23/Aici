// Ported from the Stitch mockups' input/button treatment: h-11 (44px, touch-target
// compliant), pill-shaped primary actions, role tokens instead of a fixed slate/brand
// palette so every one of these repaints correctly under the dark/light toggle for free.
//
// Deliberately a SEPARATE file from ui/styles.ts, not a replacement for it: styles.ts is
// shared by ~19 files across the whole app, most of which haven't been redesigned yet and
// have their own hardcoded, theme-blind markup around them. Making styles.ts itself
// dark-aware made every one of those un-migrated pages partially react to the dark toggle —
// e.g. ReportForm's textarea going dark while its own label and card stayed hardcoded light.
// Only screens actually redesigned against the new design system should import from here;
// everything else keeps using the untouched, theme-blind exports in styles.ts until its own
// phase migrates it.
export const inputClass =
  "w-full h-11 rounded-lg border-none bg-surface-container-low px-space-md text-body-md text-on-surface " +
  "placeholder:text-outline-variant outline-none transition-all " +
  "focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/10";

export const primaryButton =
  "w-full h-11 rounded-full bg-primary font-label-lg text-label-lg text-on-primary shadow-sm transition-all " +
  "hover:bg-primary-container active:scale-[0.99] disabled:opacity-50";

export const secondaryButton =
  "rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-label-lg text-label-lg text-on-surface transition-colors " +
  "hover:border-outline hover:bg-surface-container-low active:bg-surface-container disabled:opacity-50";

export const dangerButton =
  "rounded-lg bg-error px-4 py-2.5 font-label-lg text-label-lg text-on-error shadow-sm transition-colors " +
  "hover:opacity-90 active:opacity-80 disabled:opacity-50";

export const labelClass = "mb-1.5 block font-label-lg text-label-lg text-on-surface";

export const linkClass = "font-label-lg text-label-lg text-primary transition-colors hover:underline";
