"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Check, CircleX, Hourglass, Landmark, Map, MessageSquareText, Scale, Share2, Trophy } from "lucide";
import Icon from "@/ui/Icon";
import type { Selection } from "@/features/map/ReportsMap";
import type { CitizenReport } from "@/features/reports/queries";
import { reportPoints } from "@/features/citizens/civic-score";
import { ANSWER_DAYS, answerDeadline, deadlineText } from "@/features/reports/deadline";
import { categoryLabels, statusLabels, type Category, type Status } from "@/features/reports/validation";
import { formatDate, formatDay } from "@/ui/format";
import { body, divider, eyebrow, faint, ghostButton, muted, panel, shortCode, strong, tealButton, toneOf } from "@/features/citizens/profile/tones";

const ReportsMap = dynamic(() => import("@/features/map/ReportsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100 dark:bg-[#151d29]" />,
});

// "dd.mm, hh:mm" like the mockup, without the year
function shortDate(iso: string) {
  return formatDate(iso).replace(/\.\d{4},?/, ",");
}

function Deadline({ r, now }: { r: CitizenReport; now: number }) {
  const deadline = answerDeadline(r.created_at, r.status, now);
  const points = reportPoints(r);

  if (!deadline) {
    const resolved = r.status === "rezolvat";
    const closedAt = [...r.events].reverse().find((e) => e.status === r.status)?.at;
    return (
      <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 dark:border-teal-700/40 dark:bg-teal-900/20">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300">Sesizare închisă</span>
          <span className="rounded bg-teal-100 px-2 py-0.5 font-mono text-xs font-bold text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
            {statusLabels[r.status as Status]}
          </span>
        </div>
        <div
          className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
          role="progressbar"
          aria-label={`Sesizare închisă: ${statusLabels[r.status as Status]}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={100}
        >
          <div className={`h-full w-full rounded-full ${resolved ? "bg-teal-600 dark:bg-teal-400" : "bg-slate-400"}`} />
        </div>
        <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 dark:text-slate-400">
          <span>Trimisă: {shortDate(r.created_at)}</span>
          {closedAt && <span className="font-sans font-semibold">Închisă: {formatDay(closedAt)}</span>}
        </div>
        <div className={`mt-3 flex items-center gap-2.5 border-t border-teal-100 pt-3 text-xs dark:border-teal-700/40 ${body}`}>
          <Icon node={Trophy} className="h-[18px] w-[18px] text-teal-600 dark:text-teal-400" />
          <span>
            Scor civic:{" "}
            <strong className={`font-semibold ${strong}`}>
              {points > 0 ? `+${points} pct câștigate` : "0 pct, sesizările respinse nu aduc puncte"}
            </strong>
          </span>
        </div>
      </div>
    );
  }

  const elapsed = Math.min(1, Math.max(0, (ANSWER_DAYS - deadline.daysLeft) / ANSWER_DAYS));
  const late = deadline.daysLeft < 0;
  return (
    <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 dark:border-teal-700/40 dark:bg-teal-900/20">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300">Termen legal de răspuns</span>
        <span className="rounded bg-teal-100 px-2 py-0.5 font-mono text-xs font-bold text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
          {ANSWER_DAYS} zile
        </span>
      </div>
      <div
        className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-label="Cât a trecut din termenul legal de răspuns"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(elapsed * 100)}
      >
        <div
          className={`h-full rounded-full transition-all ${late ? "bg-red-500" : "bg-teal-600 dark:bg-teal-400"}`}
          style={{ width: `${elapsed * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
        <span className="whitespace-nowrap">Trimisă: {shortDate(r.created_at)}</span>
        <span className={`font-sans font-semibold ${late ? "text-red-700 dark:text-red-400" : "text-amber-800 dark:text-amber-400"}`}>
          Termen: {formatDay(deadline.due)} ({deadlineText(deadline.daysLeft)})
        </span>
      </div>
      <div className={`mt-3 flex items-center gap-2.5 border-t border-teal-100 pt-3 text-xs dark:border-teal-700/40 ${body}`}>
        <Icon node={Scale} className="h-[18px] w-[18px] text-teal-600 dark:text-teal-400" />
        <span>
          Temei: <strong className={`font-semibold ${strong}`}>Codul administrativ, art. 60</strong>
        </span>
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
        <time dateTime={at} className={`font-mono text-[10px] ${faint}`}>
          {shortDate(at)}
        </time>
      </div>
      {children}
    </li>
  );
}

function Timeline({ r }: { r: CitizenReport }) {
  return (
    <div>
      <span className={`mb-3 block ${eyebrow}`}>Jurnal de intervenție & actualizări primărie</span>
      <ol className="relative ml-2 space-y-4 border-l-2 border-slate-200 pl-6 dark:border-slate-700/50">
        <Step icon={Check} dot="bg-teal-600 dark:bg-teal-500" title="Sesizare trimisă" titleClass={strong} at={r.created_at}>
          <p className={`mt-0.5 text-[11px] ${muted}`}>Înregistrată în Aici și trimisă primăriei.</p>
        </Step>
        {r.events.map((e) => {
          const changed = e.status !== e.previous;
          const tone = toneOf(e.status);
          return (
            <Step
              key={e.id}
              icon={changed ? (e.status === "respins" ? CircleX : e.status === "rezolvat" ? Check : undefined) : MessageSquareText}
              dot={changed ? tone.dot : "bg-teal-700 dark:bg-teal-600"}
              title={changed ? `Status: ${statusLabels[e.status as Status] ?? e.status}` : "Mesaj de la primărie"}
              titleClass={changed ? tone.text : "text-teal-800 dark:text-teal-400"}
              at={e.at}
            >
              {e.note && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700/40 dark:bg-[#151d29]">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <Icon node={Landmark} className="h-[15px] w-[15px] text-teal-600 dark:text-teal-400" />
                    <span>Primăria Chișinău</span>
                  </div>
                  <p className={`whitespace-pre-line break-words text-xs italic leading-relaxed ${body}`}>«{e.note}»</p>
                </div>
              )}
            </Step>
          );
        })}
        {r.events.length === 0 && (
          <Step icon={Hourglass} dot="bg-amber-500" title="Așteaptă verificarea" titleClass="text-amber-800 dark:text-amber-400" at={r.created_at}>
            <p className={`mt-0.5 text-[11px] ${muted}`}>Primăria nu a actualizat-o încă. Te anunțăm pe email.</p>
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
  return (
    <div id="fisa" className={`scroll-mt-20 overflow-hidden rounded-xl border shadow-sm ${panel}`}>
      <div className="flex items-center justify-between gap-3 bg-slate-900 p-4 text-white dark:border-b dark:border-slate-700/50 dark:bg-[#151d29]">
        <div className="min-w-0">
          <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-teal-400">Fișa sesizării</span>
          <h3 className="text-sm font-bold tracking-tight text-white">
            {categoryLabels[r.category as Category] ?? r.category}
          </h3>
        </div>
        <span className="shrink-0 rounded border border-teal-700 bg-teal-800 px-2 py-0.5 font-mono text-[11px] font-bold text-teal-200 dark:border-teal-700/50 dark:bg-teal-900/50 dark:text-teal-300">
          {shortCode(r.id)}
        </span>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <Deadline r={r} now={now} />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className={eyebrow}>Fotografia ta din teren</span>
            <span className={`font-mono text-[11px] ${faint}`}>fără metadate</span>
          </div>
          <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-200 shadow-inner dark:border-slate-700/50">
            {/* eslint-disable-next-line @next/next/no-img-element -- served by our own authorized route */}
            <img src={`/api/media/${r.id}`} alt="Fotografia trimisă cu sesizarea" className="h-full w-full bg-slate-100 object-cover dark:bg-[#151d29]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-xs text-white">
              <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-[11px] backdrop-blur-sm">
                Locație: {r.lat.toFixed(3)}, {r.lng.toFixed(3)}
              </span>
              <span className="rounded bg-teal-600 px-2 py-0.5 text-[11px] font-medium" title="Fețele și numerele de înmatriculare sunt blurate, datele EXIF șterse">
                Protejată
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className={eyebrow}>Localizare pe hartă</span>
            <span className="font-mono text-[11px] font-semibold text-teal-700 dark:text-teal-400">
              GPS: {r.lat.toFixed(3)}° N, {r.lng.toFixed(3)}° E
            </span>
          </div>
          <div className="relative isolate h-52 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700/50 dark:bg-[#151d29]">
            <ReportsMap reports={reports} selection={selection} onPick={onPick} photos={false} popups={false} />
            <div className="pointer-events-none absolute bottom-2 left-2 z-10 rounded border border-slate-200 bg-white/90 px-2 py-1 font-mono text-[10px] text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-700/50 dark:bg-[#19212e]/90 dark:text-slate-300">
              Precizie: ~100 m • Chișinău
            </div>
          </div>
        </div>

        <Timeline r={r} />

        <div className={`flex flex-wrap items-center gap-2.5 border-t pt-3 ${divider}`}>
          {r.status !== "respins" && (
            <Link
              href="/map"
              className={`flex h-9 min-w-[140px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${tealButton}`}
            >
              <Icon node={Map} className="h-4 w-4" />
              <span>Vezi pe harta publică</span>
            </Link>
          )}
          <button
            type="button"
            onClick={invite}
            className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${ghostButton}`}
            title="Trimite Aici unui vecin"
          >
            <Icon node={Share2} className="h-4 w-4" />
            <span>Invită un vecin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
