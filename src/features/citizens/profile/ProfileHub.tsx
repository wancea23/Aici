"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { CirclePlus, Inbox, Search, Trophy } from "lucide";
import Icon from "@/ui/Icon";
import type { Selection } from "@/features/map/ReportsMap";
import type { CitizenReport } from "@/features/reports/queries";
import { POINTS, type CivicScore } from "@/features/citizens/civic-score";
import { categories, categoryLabels, statuses, statusLabels } from "@/features/reports/validation";
import { howMany } from "@/ui/format";
import ReportCard from "@/features/citizens/profile/ReportCard";
import ReportInspector from "@/features/citizens/profile/ReportInspector";
import MessageList, { cityMessages } from "@/features/citizens/profile/MessageList";
import useSection from "@/features/citizens/profile/useHash";
import { field, muted, panel, shortCode, strong, tealButton } from "@/features/citizens/profile/tones";

function NextLevelCard({ score }: { score: CivicScore }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-gradient-to-r from-teal-900 to-slate-900 p-5 text-white shadow-sm dark:border dark:border-teal-700/40 dark:from-[#0f2e2a] dark:to-[#19212e] sm:flex-row sm:items-center">
      <div className="min-w-0">
        <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">
          {score.next ? `Progres civic — urmează nivelul ${score.next.level}` : "Progres civic — nivel maxim"}
        </span>
        <p className="mt-1 max-w-sm text-xs text-slate-300">
          O sesizare acceptată aduce {POINTS.accepted} pct, lucrarea începută încă {POINTS.inWork}, iar rezolvarea încă{" "}
          {POINTS.resolved}.
        </p>
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-xl font-bold tracking-tight text-white">
            {score.points}
            {score.next ? ` / ${score.next.min}` : ""} pct
          </span>
          <span className="text-[11px] text-teal-300">• {score.next ? score.next.title : score.level.title}</span>
        </div>
      </div>
      <Link
        href="/"
        className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-teal-500 px-4 text-xs font-bold text-slate-950 shadow-sm transition-colors hover:bg-teal-400 dark:bg-[#6bd8cb] dark:hover:bg-[#4fc3b4]"
      >
        <Icon node={Trophy} className="h-4 w-4" />
        Raportează
      </Link>
    </div>
  );
}

// now: the server's clock at render, so deadlines come out the same on the server and in the browser
export default function ProfileHub({
  reports,
  score,
  now,
  unreadNotes,
}: {
  reports: CitizenReport[];
  score: CivicScore;
  now: number;
  // a message from the city hall in the last week
  unreadNotes: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [selection, setSelection] = useState<Selection>(reports[0] ? { id: reports[0].id, from: "list" } : null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    return reports.filter(
      (r) =>
        (!category || r.category === category) &&
        (!status || r.status === status) &&
        (!q ||
          shortCode(r.id).includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (categoryLabels[r.category as keyof typeof categoryLabels] ?? "").toLowerCase().includes(q)),
    );
  }, [reports, query, category, status]);

  const selected = reports.find((r) => r.id === selection?.id) ?? null;

  const pickFromList = useCallback((id: string) => {
    setSelection({ id, from: "list" });
    // on narrow screens the sheet sits under the list
    if (window.matchMedia("(max-width: 1279px)").matches) {
      requestAnimationFrame(() => document.getElementById("fisa")?.scrollIntoView({ behavior: "smooth" }));
    }
  }, []);
  const pickFromMap = useCallback((id: string) => setSelection({ id, from: "map" }), []);

  const section = useSection();
  const messages = useMemo(() => cityMessages(reports), [reports]);

  return (
    <div className="grid grid-cols-1 items-start gap-6 sm:gap-8 xl:grid-cols-12">
      <div className="relative space-y-4 xl:col-span-7">
        {/* both anchors always exist, so the sidebar links scroll here from anywhere */}
        <span id="sesizari" className="absolute -top-20" aria-hidden="true" />
        <span id="mesaje" className="absolute -top-20" aria-hidden="true" />

        {/* on phones the sidebar is hidden, so the two sections get tabs here */}
        <nav aria-label="Secțiunile profilului" className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm dark:border-slate-700/50 dark:bg-[#19212e] lg:hidden">
          {(
            [
              ["#sesizari", "reports", `Sesizări (${reports.length})`],
              ["#mesaje", "messages", `Mesaje (${messages.length})`],
            ] as const
          ).map(([href, key, label]) => (
            <a
              key={key}
              href={href}
              aria-current={section === key ? "location" : undefined}
              className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-teal-400 dark:focus-visible:ring-offset-[#19212e] flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center transition-colors ${
                section === key
                  ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-[#0e1a2b]"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#222e40]"
              }`}
            >
              {label}
              {key === "messages" && unreadNotes && (
                <span className="h-2 w-2 rounded-full bg-amber-500">
                  <span className="sr-only">Ai mesaje noi</span>
                </span>
              )}
            </a>
          ))}
        </nav>

        {section === "messages" ? (
          <>
            <div
              className={`flex flex-col justify-between gap-2 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center ${panel}`}
            >
              <div>
                <h3 className={`text-base font-bold tracking-tight ${strong}`}>Mesaje de la primărie</h3>
                <p className={`text-xs ${muted}`}>Răspunsurile primăriei la sesizările tale, cele mai noi primele</p>
              </div>
              <span className="self-start rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-700 dark:border-slate-700/50 dark:bg-[#222e40] dark:text-slate-200 sm:self-auto">
                {howMany(messages.length, messages.length === 1 ? "mesaj" : "mesaje")}
              </span>
            </div>
            <MessageList messages={messages} selectedId={selected?.id} now={now} onOpen={pickFromList} />
          </>
        ) : (
          <>
            <div className={`space-y-3 rounded-xl border p-4 shadow-sm ${panel}`}>
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h3 className={`text-base font-bold tracking-tight ${strong}`}>Registrul sesizărilor mele</h3>
                  <p className={`text-xs ${muted}`}>Urmărește ce face primăria Chișinău cu fiecare problemă trimisă</p>
                </div>
                <span className="self-start rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-700 dark:border-slate-700/50 dark:bg-[#222e40] dark:text-slate-200 sm:self-auto">
                  {howMany(reports.length, reports.length === 1 ? "sesizare trimisă" : "sesizări trimise")}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-12">
                <label className="relative sm:col-span-4">
                  <span className="sr-only">Caută</span>
                  <Icon
                    node={Search}
                    className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Caută după cod sau descriere..."
                    className={`py-2 pl-9 pr-3 ${field}`}
                  />
                </label>
                <label className="sm:col-span-4">
                  <span className="sr-only">Categorie</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`px-2.5 py-2 ${field}`}
                  >
                    <option value="">Toate categoriile</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {categoryLabels[c]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-4">
                  <span className="sr-only">Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={`px-2.5 py-2 ${field}`}>
                    <option value="">Toate statusurile</option>
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {statusLabels[s]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {reports.length === 0 ? (
              <div
                className={`flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center ${panel}`}
              >
                <Icon node={Inbox} className="h-7 w-7 text-slate-400" />
                <p className={`text-sm font-semibold ${strong}`}>Nu ai trimis nicio sesizare încă.</p>
                <p className={`max-w-sm text-xs ${muted}`}>
                  Prima sesizare acceptată îți aduce {POINTS.accepted} pct și insigna „Prima sesizare”.
                </p>
                <Link
                  href="/"
                  className={`mt-1 flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-semibold ${tealButton}`}
                >
                  <Icon node={CirclePlus} className="h-[18px] w-[18px]" />
                  Raportează o problemă
                </Link>
              </div>
            ) : shown.length === 0 ? (
              <p className={`rounded-xl border p-6 text-center text-xs ${panel} ${muted}`}>
                Nicio sesizare nu se potrivește filtrelor.
              </p>
            ) : (
              shown.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  selected={r.id === selected?.id}
                  onSelect={() => pickFromList(r.id)}
                />
              ))
            )}
          </>
        )}
      </div>

      <div className="space-y-4 xl:col-span-5">
        {selected && (
          <ReportInspector report={selected} reports={reports} selection={selection} onPick={pickFromMap} now={now} />
        )}
        <NextLevelCard score={score} />
      </div>
    </div>
  );
}
