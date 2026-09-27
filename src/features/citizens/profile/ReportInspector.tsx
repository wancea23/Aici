"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Check, CircleX, Clock, Hourglass, Landmark, Map, MessageSquareText, Share2 } from "lucide";
import Icon from "@/ui/Icon";
import type { Selection } from "@/features/map/ReportsMap";
import type { CitizenReport } from "@/features/reports/queries";
import { ANSWER_DAYS, answerDeadline, deadlineText } from "@/features/reports/deadline";
import { categoryLabels, statusLabels, type Category, type Status } from "@/features/reports/validation";
import { formatDate, formatDay } from "@/ui/format";
import { body, divider, eyebrow, faint, ghostButton, muted, panel, shortCode, strong, tealButton, toneOf } from "@/features/citizens/profile/tones";

const ReportsMap = dynamic(() => import("@/features/map/ReportsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100 dark:bg-[#151d29]" />,
});

// "dd.mm, hh:mm", without the year
function shortDate(iso: string) {
  return formatDate(iso).replace(/\.\d{4},?/, ",");
}

// One line with a thin bar: how long the city hall still has to answer, or when it closed the report.
function Deadline({ r, now }: { r: CitizenReport; now: number }) {
  const deadline = answerDeadline(r.created_at, r.status, now);

  if (!deadline) {
    const closedAt = [...r.events].reverse().find((e) => e.status === r.status)?.at;
    return (
      <p className={`flex items-center gap-2 text-xs ${body}`}>
        <Icon node={r.status === "rezolvat" ? Check : CircleX} className={`h-4 w-4 ${toneOf(r.status).text}`} />
        {statusLabels[r.status as Status]}
        {closedAt ? ` pe ${formatDay(closedAt)}` : ""}
      </p>
    );
  }

  const elapsed = Math.min(1, Math.max(0, (ANSWER_DAYS - deadline.daysLeft) / ANSWER_DAYS));
  const late = deadline.daysLeft < 0;
  return (
    <div title={`Primăria are ${ANSWER_DAYS} de zile să răspundă (Codul administrativ, art. 60)`}>
      <p className={`flex flex-wrap items-center gap-x-2 text-xs ${body}`}>
        <Icon node={Clock} className={`h-4 w-4 ${late ? "text-red-600 dark:text-red-400" : "text-teal-600 dark:text-teal-400"}`} />
        Răspuns până pe <strong className={`font-semibold ${strong}`}>{formatDay(deadline.due)}</strong>
        <span className={late ? "font-semibold text-red-700 dark:text-red-400" : muted}>({deadlineText(deadline.daysLeft)})</span>
      </p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-label="Cât a trecut din termenul legal de răspuns"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(elapsed * 100)}
      >
        <div
          className={`h-full rounded-full ${late ? "bg-red-500" : "bg-teal-600 dark:bg-teal-400"}`}
          style={{ width: `${elapsed * 100}%` }}
        />
      </div>
    </div>
  );
}

function Step({
  icon,
  dot,
  title,
  titleClass,
  at,
  children,
}: {
  icon?: Parameters<typeof Icon>[0]["node"];
  dot: string;
  title: string;
  titleClass: string;
  at: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="relative">
      <div
        className={`absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white ring-4 ring-white dark:ring-[#19212e] ${dot}`}
      >
        {icon ? <Icon node={icon} className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </div>
      <div className="flex flex-wrap items-center gap-x-2">
        <span className={`text-xs font-bold ${titleClass}`}>{title}</span>
        <time dateTime={at} className={`text-[11px] ${faint}`}>
          {shortDate(at)}
        </time>
      </div>
      {children}
    </li>
  );
}

function Timeline({ r }: { r: CitizenReport }) {
  // the first "nou" event is the report being created, already the "Trimisă" step
  const events = r.events.filter((e) => e.previous !== null || e.status !== "nou" || e.note);
  return (
    <div>
      <span className={`mb-3 block ${eyebrow}`}>Istoric</span>
      <ol className="relative ml-2 space-y-4 border-l-2 border-slate-200 pl-6 dark:border-slate-700/50">
        <Step icon={Check} dot="bg-teal-600 dark:bg-teal-500" title="Trimisă" titleClass={strong} at={r.created_at} />
        {events.map((e) => {
          const changed = e.status !== e.previous;
          const tone = toneOf(e.status);
          return (
            <Step
              key={e.id}
              icon={changed ? (e.status === "respins" ? CircleX : e.status === "rezolvat" ? Check : undefined) : MessageSquareText}
              dot={changed ? tone.dot : "bg-teal-700 dark:bg-teal-600"}
              title={changed ? statusLabels[e.status as Status] ?? e.status : "Mesaj de la primărie"}
              titleClass={changed ? tone.text : "text-teal-800 dark:text-teal-400"}
              at={e.at}
            >
              {e.note && (
                <p className={`mt-2 flex gap-2 whitespace-pre-line break-words rounded-lg bg-slate-50 p-3 text-xs leading-relaxed dark:bg-[#151d29] ${body}`}>
                  <Icon node={Landmark} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                  <span>{e.note}</span>
                </p>
              )}
            </Step>
          );
        })}
        {events.length === 0 && (
          <Step icon={Hourglass} dot="bg-amber-500" title="Așteaptă verificarea" titleClass="text-amber-800 dark:text-amber-400" at={r.created_at}>
            <p className={`mt-0.5 text-[11px] ${muted}`}>Te anunțăm pe email când primăria o preia.</p>
          </Step>
        )}
      </ol>
    </div>
  );
}

async function invite() {
  const url = `${window.location.origin}/`;
  const text = "Raportează și tu problemele din cartier pe Aici.";
  try {
    if (navigator.share) await navigator.share({ title: "Aici", text, url });
    else await navigator.clipboard.writeText(url);
  } catch {
    // closed the share sheet, nothing to do
  }
}

export default function ReportInspector({
  report: r,
  reports,
  selection,
  onPick,
  now,
}: {
  report: CitizenReport;
  reports: CitizenReport[];
  selection: Selection;
  onPick: (id: string) => void;
  now: number;
}) {
  const tone = toneOf(r.status);
  return (
    <section id="fisa" aria-label="Detaliile sesizării" className={`scroll-mt-20 overflow-hidden rounded-xl border shadow-sm ${panel}`}>
      <div className="relative h-48 w-full bg-slate-100 dark:bg-[#151d29]">
        {/* eslint-disable-next-line @next/next/no-img-element -- served by our own authorized route */}
        <img
          src={`/api/media/${r.id}`}
          alt="Fotografia trimisă cu sesizarea"
          title="Fețele și numerele de înmatriculare sunt blurate, datele ascunse din poză șterse"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={`text-base font-bold tracking-tight ${strong}`}>{categoryLabels[r.category as Category] ?? r.category}</h2>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.pill}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
              {statusLabels[r.status as Status] ?? r.status}
            </span>
          </div>
          <p className={`mt-0.5 font-mono text-[11px] ${faint}`}>{shortCode(r.id)}</p>
          {r.description && <p className={`mt-3 text-sm leading-relaxed ${body}`}>{r.description}</p>}
        </div>

        <Deadline r={r} now={now} />

        <div className="relative isolate h-40 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700/50 dark:bg-[#151d29]">
          <ReportsMap reports={reports} selection={selection} onPick={onPick} photos={false} popups={false} />
        </div>

        <Timeline r={r} />

        <div className={`flex flex-wrap items-center gap-2.5 border-t pt-4 ${divider}`}>
          {r.status !== "respins" && (
            <Link
              href="/map"
              className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${tealButton}`}
            >
              <Icon node={Map} className="h-4 w-4" />
              Vezi pe harta publică
            </Link>
          )}
          <button
            type="button"
            onClick={invite}
            className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${ghostButton}`}
          >
            <Icon node={Share2} className="h-4 w-4" />
            Invită un vecin
          </button>
        </div>
      </div>
    </section>
  );
}
