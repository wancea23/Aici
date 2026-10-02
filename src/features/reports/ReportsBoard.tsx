"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlarmClock, Inbox } from "lucide";
import Icon from "@/ui/Icon";
import ReportDetails, { DeadlinePill } from "@/features/reports/ReportDetails";
import type { Report } from "@/features/reports/queries";
import type { Selection } from "@/features/map/ReportsMap";
import {
  categoryIcons,
  categoryLabels,
  statusColors,
  statusLabels,
  statuses,
  type Category,
  type Status,
} from "@/features/reports/validation";
import { formatDate, howMany, timeAgo } from "@/ui/format";
import { answerDeadline } from "@/features/reports/deadline";

// The map needs the browser, so it only renders on the client.
const ReportsMap = dynamic(() => import("@/features/map/ReportsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-container" />,
});

export default function ReportsBoard({ reports }: { reports: Report[] }) {
  const [selection, setSelection] = useState<Selection>(null);
  const mapBox = useRef<HTMLDivElement>(null);

  const pickFromMap = useCallback((id: string) => setSelection({ id, from: "map" }), []);

  function pickFromList(id: string) {
    setSelection({ id, from: "list" });
    const el = mapBox.current;
    // the top bar is sticky (taller on phones, with the menu), so under it counts as hidden
    const bar = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
    if (el && el.getBoundingClientRect().top < bar) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // On wide screens the list sits next to the map, so bring the picked card into view.
  useEffect(() => {
    if (selection?.from !== "map") return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    document
      .getElementById(`r-${selection.id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selection]);

  const counts: Record<string, number> = {};
  for (const r of reports) counts[r.status] = (counts[r.status] ?? 0) + 1;
  const overdue = reports.filter((r) => (answerDeadline(r.created_at, r.status)?.daysLeft ?? 0) < 0).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {statuses.map((s) => (
          <span
            key={s}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-lowest px-3 font-label-lg text-label-lg text-on-surface"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[s] }} />
            {statusLabels[s]}
            <span className="font-mono text-on-surface-variant">{counts[s] ?? 0}</span>
          </span>
        ))}
        {overdue > 0 && (
          <span className="inline-flex h-8 items-center gap-2 rounded-full bg-error px-3 font-label-lg text-label-lg text-on-error">
            <Icon node={AlarmClock} className="h-4 w-4" />
            Termen depășit: {overdue}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:h-[calc(100vh-10.5rem)] lg:min-h-[28rem] lg:grid-cols-5">
        <div
          ref={mapBox}
          className="isolate h-80 scroll-mt-32 overflow-hidden lg:scroll-mt-20 rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm lg:col-span-3 lg:h-full"
        >
          <ReportsMap reports={reports} selection={selection} onPick={pickFromMap} />
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant py-12 text-center text-outline lg:col-span-2">
            <Icon node={Inbox} className="h-8 w-8" />
            <p className="font-body-sm text-body-sm text-on-surface-variant">Nicio sesizare încă.</p>
          </div>
        ) : (
          <ul className="space-y-3 lg:col-span-2 lg:overflow-y-auto lg:p-1">
            {reports.map((r) => (
              <li key={r.id} id={`r-${r.id}`}>
                <button
                  type="button"
                  onClick={() => pickFromList(r.id)}
                  aria-expanded={selection?.id === r.id}
                  className={
                    "flex w-full gap-3 rounded-xl border bg-surface-container-lowest p-2.5 text-left transition-[border-color,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 " +
                    (selection?.id === r.id
                      ? "border-primary shadow-md ring-2 ring-primary/15"
                      : "border-outline-variant/60 shadow-sm hover:border-outline hover:shadow-md")
                  }
                >
                  <img
                    src={`/api/media/${r.id}`}
                    alt=""
                    loading="lazy"
                    className="h-[84px] w-[84px] flex-none rounded-lg bg-surface-container object-cover"
                  />
                  <span className="block min-w-0 flex-1 py-0.5 pr-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2 font-label-lg text-label-lg text-on-surface">
                        <CategoryBadge category={r.category} status={r.status} />
                        <span className="truncate">
                          {categoryLabels[r.category as Category] ?? r.category}
                        </span>
                      </span>
                      <time
                        dateTime={r.created_at}
                        title={formatDate(r.created_at)}
                        suppressHydrationWarning
                        className="flex-none text-xs text-on-surface-variant"
                      >
                        {timeAgo(r.created_at)}
                      </time>
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      <StatusPill status={r.status} />
                      <DeadlinePill createdAt={r.created_at} status={r.status} />
                      {r.members.length > 0 && (
                        <span className="rounded-full bg-inverse-surface px-2 py-0.5 text-xs font-medium text-inverse-on-surface">
                          {howMany(r.members.length + 1, "sesizări")}
                        </span>
                      )}
                    </span>
                    {r.description && (
                      <span className="mt-1 line-clamp-1 font-body-sm text-body-sm leading-snug text-on-surface-variant">
                        {r.description}
                      </span>
                    )}
                  </span>
                </button>
                {selection?.id === r.id && <ReportDetails report={r} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

// Same icon and color as the report's pin on the map.
function CategoryBadge({ category, status }: { category: string; status: string }) {
  const node = categoryIcons[category as Category] ?? categoryIcons.altul;
  return (
    <span
      className="grid h-7 w-7 flex-none place-items-center rounded-full text-white shadow-sm"
      style={{ backgroundColor: statusColors[status as Status] ?? "#64748b" }}
    >
      <Icon node={node} className="h-4 w-4" />
    </span>
  );
}

// The status with its map color as a dot, readable in both themes.
function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium text-on-surface">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColors[status as Status] ?? "#64748b" }} />
      {statusLabels[status as Status] ?? status}
    </span>
  );
}
