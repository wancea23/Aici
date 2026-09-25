import { BadgeCheck, BellRing, ChevronRight, CircleX, HardHat, Hourglass, MapPin } from "lucide";
import Icon from "@/ui/Icon";
import type { CitizenReport } from "@/features/reports/queries";
import { reportPoints } from "@/features/citizens/civic-score";
import { categoryIcons, categoryLabels, statusLabels, type Category, type Status } from "@/features/reports/validation";
import { formatDay, timeAgo } from "@/ui/format";
import { body, divider, faint, ghostButton, muted, shortCode, strong, toneOf } from "@/features/citizens/profile/tones";

// When the report reached its current status, from its history.
function statusSince(r: CitizenReport) {
  return [...r.events].reverse().find((e) => e.status === r.status && e.status !== e.previous)?.at;
}

function Footer({ r }: { r: CitizenReport }) {
  const hasNote = r.events.some((e) => e.note);
  if (r.status === "rezolvat") {
    const at = statusSince(r);
    return (
      <span className="flex items-center gap-1.5">
        <Icon node={BadgeCheck} className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        Problemă rezolvată de primărie{at ? ` pe ${formatDay(at)}` : ""}
      </span>
    );
  }
  if (r.status === "respins") {
    return (
      <span className="flex items-center gap-1.5">
        <Icon node={CircleX} className="h-4 w-4 text-slate-400" />
        Respinsă, motivul e în fișă
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5">
        <Icon
          node={r.status === "in_lucru" ? HardHat : Hourglass}
          className={`h-4 w-4 ${r.status === "in_lucru" ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`}
        />
        {r.status === "in_lucru" ? "Primăria lucrează la ea" : "Așteaptă verificarea primăriei"}
      </span>
      {hasNote && (
        <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/40 dark:text-amber-300">
          <Icon node={BellRing} className="h-3.5 w-3.5" />
          Mesaj de la primărie
        </span>
      )}
    </span>
  );
}

export default function ReportCard({
  report: r,
  selected,
  onSelect,
}: {
  report: CitizenReport;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone = toneOf(r.status);
  const label = categoryLabels[r.category as Category] ?? r.category;
  const points = reportPoints(r);

  return (
    <article
      className={`relative overflow-hidden rounded-xl bg-white p-4 shadow-sm sm:p-5 transition-all dark:bg-[#19212e] ${
        selected
          ? "border-2 border-teal-600 ring-1 ring-teal-600/20 dark:border-teal-400 dark:ring-teal-400/20"
          : "border border-slate-200 hover:border-slate-300 dark:border-slate-700/50 dark:hover:border-slate-600"
      } ${r.status === "respins" && !selected ? "opacity-85" : ""}`}
    >
      {selected && (
        <div className="absolute right-0 top-0 hidden sm:block rounded-bl-lg bg-teal-600 px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white dark:bg-teal-500 dark:text-[#0e1a2b]">
          Deschisă în fișă
        </div>
      )}

      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone.box}`}>
            <Icon node={categoryIcons[r.category as Category] ?? categoryIcons.altul} className="h-[22px] w-[22px]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className={`text-sm font-bold ${r.status === "respins" ? "text-slate-800 dark:text-slate-200" : strong}`}>
                {label}
              </h4>
              <span className={`flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[11px] font-bold ${tone.pill}`}>
                {r.status !== "respins" && <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />}
                {statusLabels[r.status as Status] ?? r.status}
              </span>
            </div>
            <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs ${muted}`}>
              <span className={`font-semibold ${r.status === "respins" ? muted : "text-teal-700 dark:text-teal-400"}`}>
                {shortCode(r.id)}
              </span>
              <span aria-hidden="true">•</span>
              <span className={`flex items-center gap-1 whitespace-nowrap ${body}`}>
                <Icon node={MapPin} className={`h-[15px] w-[15px] ${r.status === "respins" ? "text-slate-400" : "text-teal-600 dark:text-teal-400"}`} />
                {r.lat.toFixed(3)}, {r.lng.toFixed(3)}
              </span>
              <span aria-hidden="true">•</span>
              <time dateTime={r.created_at} className="whitespace-nowrap font-sans" suppressHydrationWarning>
                {timeAgo(r.created_at)}
              </time>
            </div>
          </div>
        </div>
        {!selected && (
          <button
            type="button"
            onClick={onSelect}
            aria-label={`Detalii despre ${label}`}
            className={`flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors sm:px-3 ${ghostButton}`}
          >
            <span className="hidden sm:inline">Detalii</span>
            <Icon node={ChevronRight} className="h-4 w-4" />
          </button>
        )}
      </div>

      {selected && (
        <p className={`mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed dark:border-slate-700/40 dark:bg-[#151d29] ${body}`}>
          {r.description || <span className={faint}>Fără descriere.</span>}
        </p>
      )}

      <div className={`mt-3 flex items-end justify-between gap-3 border-t pt-3 text-xs sm:items-center ${divider} ${muted}`}>
        <Footer r={r} />
        <span
          className={`shrink-0 font-mono text-[11px] font-semibold ${points > 0 ? "text-teal-700 dark:text-teal-400" : faint}`}
          title="Puncte de scor civic pentru această sesizare"
        >
          {points > 0 ? `+${points}` : "0"} pct
        </span>
      </div>
    </article>
  );
}
