"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Inbox } from "lucide";
import Icon from "@/ui/Icon";
import ReportDetails, { DeadlinePill } from "@/features/reports/ReportDetails";
import type { Report } from "@/features/reports/queries";
import type { Selection } from "@/features/map/ReportsMap";
import {
  categoryIcons,
  categoryLabels,
  statusColors,
  statusInk,
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
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100" />,
});

export default function ReportsBoard({ reports }: { reports: Report[] }) {
  const [selection, setSelection] = useState<Selection>(null);
  const mapBox = useRef<HTMLDivElement>(null);

  const pickFromMap = useCallback((id: string) => setSelection({ id, from: "map" }), []);

  function pickFromList(id: string) {
    setSelection({ id, from: "list" });
    const el = mapBox.current;
    if (el && el.getBoundingClientRect().top < 0) {
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
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
        {statuses.map((s) => (
          <span key={s} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[s] }} />
            {statusLabels[s]}
            <span className="text-slate-400">{counts[s] ?? 0}</span>
          </span>
        ))}
        {overdue > 0 && (
          <span className="font-medium text-red-700">
            Termen depășit <span className="text-red-400">{overdue}</span>
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:h-[calc(100vh-12.5rem)] lg:min-h-[28rem] lg:grid-cols-5">
        <div
          ref={mapBox}
          className="isolate h-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-3 lg:h-full"
        >
          <ReportsMap reports={reports} selection={selection} onPick={pickFromMap} />
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400 lg:col-span-2">
            <Icon node={Inbox} className="h-8 w-8" />
            <p className="text-sm text-slate-500">Nicio sesizare încă.</p>
          </div>
        ) : (
          <ul className="space-y-3 lg:col-span-2 lg:overflow-y-auto lg:p-1">
            {reports.map((r) => (
              <li key={r.id} id={`r-${r.id}`}>
                <button
                  type="button"
                  onClick={() => pickFromList(r.id)}
                  className={
                    "flex w-full gap-3 rounded-2xl border bg-white p-2.5 text-left transition-[border-color,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 " +
                    (selection?.id === r.id
                      ? "border-brand-500 shadow-md ring-2 ring-brand-500/15"
                      : "border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md")
                  }
                >
                  <img
                    src={`/api/media/${r.id}`}
                    alt=""
                    loading="lazy"
                    className="h-[84px] w-[84px] flex-none rounded-xl bg-slate-100 object-cover"
                  />
                  <div className="min-w-0 flex-1 py-0.5 pr-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-900">
                        <CategoryBadge category={r.category} status={r.status} />
                        <span className="truncate">
                          {categoryLabels[r.category as Category] ?? r.category}
                        </span>
                      </span>
                      <time
                        dateTime={r.created_at}
                        title={formatDate(r.created_at)}
                        suppressHydrationWarning
                        className="flex-none text-xs text-slate-400"
                      >
                        {timeAgo(r.created_at)}
                      </time>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-slate-500">
                      <span className="font-medium" style={{ color: statusInk[r.status as Status] ?? "#475569" }}>
                        {statusLabels[r.status as Status] ?? r.status}
                      </span>{" "}
                      <DeadlinePill createdAt={r.created_at} status={r.status} />
                      {r.members.length > 0 && (
                        <span className="mr-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {howMany(r.members.length + 1, "sesizări")}
                        </span>
                      )}
                      {r.description}
                    </p>
                  </div>
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
