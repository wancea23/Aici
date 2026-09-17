"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type { MapReport, Selection } from "@/features/map/ReportsMap";
import { statusColors, statusLabels, statuses } from "@/features/reports/validation";

// The map needs the browser, so it only renders on the client.
const ReportsMap = dynamic(() => import("@/features/map/ReportsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100" />,
});

// Rejected reports are not on the public map, so they get no place in the legend either.
const shown = statuses.filter((s) => s !== "respins");

// details: photos and descriptions in the popups, on while PUBLIC_DETAILS is set
export default function PublicMap({ reports, details }: { reports: MapReport[]; details: boolean }) {
  const [selection, setSelection] = useState<Selection>(null);
  const pick = useCallback((id: string) => setSelection({ id, from: "map" }), []);

  const counts: Record<string, number> = {};
  for (const r of reports) counts[r.status] = (counts[r.status] ?? 0) + 1;

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
        {shown.map((s) => (
          <span key={s} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[s] }} />
            {statusLabels[s]}
            <span className="text-slate-400">{counts[s] ?? 0}</span>
          </span>
        ))}
      </div>

      <div className="isolate h-[70vh] min-h-[24rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <ReportsMap reports={reports} selection={selection} onPick={pick} photos={details} />
      </div>
    </>
  );
}
