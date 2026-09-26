import { ChevronRight, Landmark, MailOpen } from "lucide";
import Icon from "@/ui/Icon";
import type { CitizenReport } from "@/features/reports/queries";
import { categoryLabels, statusLabels, type Category, type Status } from "@/features/reports/validation";
import { formatDate } from "@/ui/format";
import { body, faint, ghostButton, inset, muted, panel, shortCode, strong, toneOf } from "@/features/citizens/profile/tones";

export const NEW_MESSAGE_MS = 7 * 24 * 60 * 60 * 1000;

export type CityMessage = {
  id: string;
  report: CitizenReport;
  note: string;
  at: string;
  // the status the report moved to with this message, when it changed
  status?: string;
};

// Every note the city hall wrote on the citizen's reports, newest first.
export function cityMessages(reports: CitizenReport[]): CityMessage[] {
  return reports
    .flatMap((report) =>
      report.events
        .filter((e) => e.note)
        .map((e) => ({
          id: e.id,
          report,
          note: e.note,
          at: e.at,
          status: e.status !== e.previous ? e.status : undefined,
        }))
    )
    .sort((a, b) => b.at.localeCompare(a.at));
}

export default function MessageList({
  messages,
  selectedId,
  now,
  onOpen,
}: {
  messages: CityMessage[];
  selectedId: string | undefined;
  now: number;
  onOpen: (reportId: string) => void;
}) {
  if (messages.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center ${panel}`}>
        <Icon node={MailOpen} className="h-7 w-7 text-slate-400" />
        <p className={`text-sm font-semibold ${strong}`}>Primăria nu ți-a scris încă.</p>
        <p className={`max-w-sm text-xs ${muted}`}>
          Când răspunde la o sesizare, mesajul apare aici și îl primești și pe email.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {messages.map((m) => {
        const selected = m.report.id === selectedId;
        const fresh = now - new Date(m.at).getTime() < NEW_MESSAGE_MS;
        const tone = m.status ? toneOf(m.status) : null;
        return (
          <li
            key={m.id}
            className={`rounded-xl bg-white p-4 shadow-sm transition-all dark:bg-[#19212e] sm:p-5 ${
              selected
                ? "border-2 border-teal-600 ring-1 ring-teal-600/20 dark:border-teal-400 dark:ring-teal-400/20"
                : "border border-slate-200 hover:border-slate-300 dark:border-slate-700/50 dark:hover:border-slate-600"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-700/40 dark:bg-teal-900/40 dark:text-teal-400">
                  <Icon node={Landmark} className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={`text-sm font-bold ${strong}`}>Primăria Chișinău</h4>
                    {fresh && (
                      <span className="rounded border border-amber-200 bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/40 dark:text-amber-300">
                        Nou
                      </span>
                    )}
                    {tone && (
                      <span className={`flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[11px] font-bold ${tone.pill}`}>
                        {statusLabels[m.status as Status] ?? m.status}
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 text-xs ${muted}`}>
                    despre{" "}
                    <span className={`font-semibold ${body}`}>
                      {categoryLabels[m.report.category as Category] ?? m.report.category}
                    </span>{" "}
                    <span className="font-mono font-semibold text-teal-700 dark:text-teal-400">{shortCode(m.report.id)}</span>
                    <span aria-hidden="true"> • </span>
                    <time dateTime={m.at} className={`whitespace-nowrap font-mono ${faint}`}>
                      {formatDate(m.at)}
                    </time>
                  </p>
                </div>
              </div>
              {!selected && (
                <button
                  type="button"
                  onClick={() => onOpen(m.report.id)}
                  aria-label={`Deschide fișa sesizării ${shortCode(m.report.id)}, ${categoryLabels[m.report.category as Category] ?? m.report.category}`}
                  className={`flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors sm:px-3 ${ghostButton}`}
                >
                  <span className="hidden sm:inline">Deschide fișa</span>
                  <Icon node={ChevronRight} className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className={`mt-3 whitespace-pre-line break-words rounded-lg border p-3 text-xs italic leading-relaxed ${inset} ${body}`}>
              «{m.note}»
            </p>
          </li>
        );
      })}
    </ul>
  );
}
