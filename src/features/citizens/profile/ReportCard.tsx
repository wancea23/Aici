import { ChevronRight, Landmark } from "lucide";
import Icon from "@/ui/Icon";
import type { CitizenReport } from "@/features/reports/queries";
import { categoryIcons, categoryLabels, statusLabels, type Category, type Status } from "@/features/reports/validation";
import { timeAgo } from "@/ui/format";
import { body, faint, muted, strong, toneOf } from "@/features/citizens/profile/tones";

// A report in the list: what, its status, when, and the city hall's latest message if there is one.
// The whole card opens the report's sheet.
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
  const lastNote = [...r.events].reverse().find((e) => e.note);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group block w-full rounded-xl bg-white p-4 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:bg-[#19212e] dark:focus-visible:ring-teal-400 ${
        selected
          ? "ring-2 ring-teal-600 dark:ring-teal-400"
          : "border border-slate-200 hover:border-slate-300 dark:border-slate-700/50 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone.box}`}>
          <Icon node={categoryIcons[r.category as Category] ?? categoryIcons.altul} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`text-sm font-bold ${strong}`}>{label}</span>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.pill}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
              {statusLabels[r.status as Status] ?? r.status}
            </span>
          </div>
          <p className={`mt-0.5 truncate text-xs ${muted}`}>
            <time dateTime={r.created_at} suppressHydrationWarning>
              {timeAgo(r.created_at)}
            </time>
            {r.description && <span className={faint}> · {r.description}</span>}
          </p>
        </div>
        <Icon
          node={ChevronRight}
          className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${selected ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`}
        />
      </div>

      {lastNote && (
        <p className={`mt-3 flex gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-[#151d29] ${body}`}>
          <Icon node={Landmark} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
          <span className="line-clamp-2">{lastNote.note}</span>
        </p>
      )}
    </button>
  );
}
