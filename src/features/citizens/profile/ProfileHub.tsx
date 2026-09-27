"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { CirclePlus, Inbox, Search } from "lucide";
import Icon from "@/ui/Icon";
import type { Selection } from "@/features/map/ReportsMap";
import type { CitizenReport } from "@/features/reports/queries";
import { POINTS } from "@/features/citizens/civic-score";
import { categoryLabels, statuses, statusLabels, type Status } from "@/features/reports/validation";
import ReportCard from "@/features/citizens/profile/ReportCard";
import ReportInspector from "@/features/citizens/profile/ReportInspector";
import MessageList, { cityMessages } from "@/features/citizens/profile/MessageList";
import useSection from "@/features/citizens/profile/useHash";
import { field, muted, panel, shortCode, strong, tealButton, toneOf } from "@/features/citizens/profile/tones";

// One chip per status with its count. They are the page's only counters and also filter the list.
function StatusChips({
  reports,
  status,
  onChange,
}: {
  reports: CitizenReport[];
  status: string;
  onChange: (s: string) => void;
}) {
  const chips = [
    { value: "", label: "Toate", count: reports.length },
    ...statuses.map((s) => ({ value: s, label: statusLabels[s], count: reports.filter((r) => r.status === s).length })),
  ].filter((c) => c.value === "" || c.count > 0);

  return (
    <div role="group" aria-label="Filtrează după status" className="flex flex-wrap gap-2">
      {chips.map((c) => {
        const on = status === c.value;
        return (
          <button
            key={c.value || "all"}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(c.value)}
            className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400 ${
              on
                ? "border-teal-600 bg-teal-600 text-white dark:border-teal-400 dark:bg-teal-500 dark:text-[#0e1a2b]"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700/50 dark:bg-[#19212e] dark:text-slate-200 dark:hover:border-slate-600"
            }`}
          >
            {c.value && <span className={`h-2 w-2 rounded-full ${toneOf(c.value).dot}`} aria-hidden="true" />}
            {c.label}
            <span className={`font-mono text-[11px] ${on ? "opacity-90" : muted}`}>{c.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// now: the server's clock at render, so deadlines come out the same on the server and in the browser
export default function ProfileHub({
  reports,
  now,
  unreadNotes,
}: {
  reports: CitizenReport[];
  now: number;
  // a message from the city hall in the last week
  unreadNotes: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [selection, setSelection] = useState<Selection>(reports[0] ? { id: reports[0].id, from: "list" } : null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    return reports.filter(
      (r) =>
        (!status || r.status === status) &&
        (!q ||
          shortCode(r.id).includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (categoryLabels[r.category as keyof typeof categoryLabels] ?? "").toLowerCase().includes(q)),
    );
  }, [reports, query, status]);

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
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
      <div className="relative space-y-4 xl:col-span-7">
        {/* both anchors always exist, so the sidebar links scroll here from anywhere */}
        <span id="sesizari" className="absolute -top-20" aria-hidden="true" />
        <span id="mesaje" className="absolute -top-20" aria-hidden="true" />

        {/* on phones the sidebar is hidden, so the two sections get tabs here */}
        <nav aria-label="Secțiunile profilului" className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm dark:border-slate-700/50 dark:bg-[#19212e] lg:hidden">
          {(
            [
              ["#sesizari", "reports", "Sesizări"],
              ["#mesaje", "messages", "Mesaje"],
            ] as const
          ).map(([href, key, label]) => (
            <a
              key={key}
              href={href}
              aria-current={section === key ? "location" : undefined}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400 ${
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
            <div>
              <h1 className={`text-lg font-bold tracking-tight ${strong}`}>Mesaje de la primărie</h1>
              <p className={`text-xs ${muted}`}>Răspunsurile primăriei la sesizările tale, cele mai noi primele</p>
            </div>
            <MessageList messages={messages} selectedId={selected?.id} now={now} onOpen={pickFromList} />
          </>
        ) : reports.length === 0 ? (
          <>
            <h1 className={`text-lg font-bold tracking-tight ${strong}`}>Sesizările mele</h1>
            <div className={`flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center ${panel}`}>
              <Icon node={Inbox} className="h-7 w-7 text-slate-400" />
              <p className={`text-sm font-semibold ${strong}`}>Nu ai trimis nicio sesizare încă.</p>
              <p className={`max-w-sm text-xs ${muted}`}>
                Prima sesizare acceptată îți aduce {POINTS.accepted} pct și insigna „Prima sesizare”.
              </p>
              <Link href="/" className={`mt-1 flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-semibold ${tealButton}`}>
                <Icon node={CirclePlus} className="h-[18px] w-[18px]" />
                Raportează o problemă
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h1 className={`text-lg font-bold tracking-tight ${strong}`}>Sesizările mele</h1>
              <label className="relative sm:w-64">
                <span className="sr-only">Caută</span>
                <Icon node={Search} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Caută o sesizare..."
                  className={`py-2 pl-9 pr-3 ${field}`}
                />
              </label>
            </div>

            <StatusChips reports={reports} status={status} onChange={setStatus} />

            {shown.length === 0 ? (
              <p className={`rounded-xl border p-6 text-center text-xs ${panel} ${muted}`}>
                {status && !query
                  ? `Nicio sesizare cu statusul „${statusLabels[status as Status]}”.`
                  : "Nicio sesizare nu se potrivește căutării."}
              </p>
            ) : (
              <div className="space-y-3">
                {shown.map((r) => (
                  <ReportCard key={r.id} report={r} selected={r.id === selected?.id} onSelect={() => pickFromList(r.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <div className="xl:col-span-5">
          <ReportInspector report={selected} reports={reports} selection={selection} onPick={pickFromMap} now={now} />
        </div>
      )}
    </div>
  );
}
