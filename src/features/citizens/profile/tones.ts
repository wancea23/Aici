import type { Status } from "@/features/reports/validation";

// Class names copied from the Command Hub mockup (my_account_citizen_command_hub_variant),
// light values first and the ones from its dark mode twin after dark:.
export const pageBg = "bg-[#f8fafc] dark:bg-[#0e141f]";
export const panel = "bg-white border-slate-200 dark:bg-[#19212e] dark:border-slate-700/50";
export const inset = "bg-slate-50 border-slate-200/80 dark:bg-[#151d29] dark:border-slate-700/40";
export const divider = "border-slate-100 dark:border-slate-700/50";

export const strong = "text-slate-900 dark:text-slate-100";
export const body = "text-slate-600 dark:text-slate-300";
export const muted = "text-slate-500 dark:text-slate-400";
export const faint = "text-slate-500 dark:text-slate-400";
export const accent = "text-teal-700 dark:text-teal-400";
export const eyebrow = "text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

// visible keyboard focus on every button and link styled from these
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-teal-400 dark:focus-visible:ring-offset-[#19212e]";

export const ghostButton =
  `${focusRing} bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#222e40] dark:text-slate-200 dark:hover:bg-slate-700`;
export const tealButton =
  `${focusRing} bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-[#6bd8cb] dark:text-[#0e1a2b] dark:hover:bg-[#4fc3b4]`;

export const field =
  "w-full rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 transition-all " +
  "focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 " +
  "dark:border-slate-700/50 dark:bg-[#151d29] dark:text-slate-200 dark:placeholder-slate-500 dark:focus:bg-[#19212e]";

type Tone = { box: string; pill: string; dot: string; text: string };

// The icon box, status pill and dot of a report, by status.
export const statusTone: Record<Status, Tone> = {
  nou: {
    box: "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-700/50 dark:text-red-300",
    pill: "bg-red-100 text-red-900 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/50",
    dot: "bg-red-600 dark:bg-red-400",
    text: "text-red-800 dark:text-red-300",
  },
  in_lucru: {
    box: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700/50 dark:text-amber-300",
    pill: "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50",
    dot: "bg-amber-600 dark:bg-amber-400",
    text: "text-amber-800 dark:text-amber-400",
  },
  rezolvat: {
    box: "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900/40 dark:border-teal-700/40 dark:text-teal-400",
    pill: "bg-teal-100 text-teal-900 border border-teal-200 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-700/50",
    dot: "bg-teal-600 dark:bg-teal-400",
    text: "text-teal-800 dark:text-teal-400",
  },
  respins: {
    box: "bg-slate-100 border-slate-200 text-slate-600 dark:bg-[#222e40] dark:border-slate-700/50 dark:text-slate-400",
    pill: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    dot: "bg-slate-500",
    text: "text-slate-700 dark:text-slate-300",
  },
};

export function toneOf(status: string) {
  return statusTone[status as Status] ?? statusTone.respins;
}

// Reports are shown by the start of their uuid, the same short code staff see.
export function shortCode(id: string) {
  return `#${id.slice(0, 8)}`;
}
