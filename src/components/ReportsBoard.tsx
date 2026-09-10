"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Report } from "@/lib/reports";
import type { Selection } from "@/components/ReportsMap";
import {
  categoryLabels,
  statusColors,
  statusLabels,
  statuses,
  type Category,
  type Status,
} from "@/lib/validation";
import { formatDate } from "@/lib/format";

// Leaflet needs the browser, so the map only renders on the client.
const ReportsMap = dynamic(() => import("@/components/ReportsMap"), {
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
      </div>

      <div className="grid gap-6 lg:h-[calc(100vh-12.5rem)] lg:min-h-[28rem] lg:grid-cols-5">
        <div
          ref={mapBox}
          className="isolate h-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-3 lg:h-full"
        >
          <ReportsMap reports={reports} selection={selection} onPick={pickFromMap} />
        </div>

        {reports.length === 0 ? (
          <p className="text-slate-500 lg:col-span-2">Nicio sesizare încă.</p>
        ) : (
          <ul className="space-y-3 lg:col-span-2 lg:overflow-y-auto lg:pr-1">
            {reports.map((r) => (
              <li key={r.id} id={`r-${r.id}`}>
                <button
                  type="button"
                  onClick={() => pickFromList(r.id)}
                  className={
                    "flex w-full gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition " +
                    (selection?.id === r.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 hover:border-slate-300")
                  }
                >
                  <img
                    src={`/api/media/${r.id}`}
                    alt=""
                    loading="lazy"
                    className="h-20 w-20 flex-none rounded-lg bg-slate-100 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">
                        {categoryLabels[r.category as Category] ?? r.category}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.description}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">{formatDate(r.created_at)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: statusColors[status as Status] ?? "#64748b" }}
      />
      {statusLabels[status as Status] ?? status}
    </span>
  );
}
