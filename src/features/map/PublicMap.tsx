"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { MapPinPlus } from "lucide";
import Icon from "@/ui/Icon";
import type { MapReport, Selection } from "@/features/map/ReportsMap";
import { categories, categoryLabels, statusColors, statusLabels, statuses, type Status } from "@/features/reports/validation";

// The map needs the browser, so it only renders on the client.
const ReportsMap = dynamic(() => import("@/features/map/ReportsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-container-low" />,
});

// Rejected reports are not on the public map, so they get no chip either.
const shown = statuses.filter((s) => s !== "respins");

// The map opens on Chisinau (west, south, east, north), not on every pin in the country.
const chisinauArea: [number, number, number, number] = [28.65, 46.9, 29.05, 47.12];

// details: photos and descriptions in the popups, on while PUBLIC_DETAILS is set
export default function PublicMap({ reports, details }: { reports: MapReport[]; details: boolean }) {
  const [selection, setSelection] = useState<Selection>(null);
  const pick = useCallback((id: string) => setSelection({ id, from: "map" }), []);
  const [hidden, setHidden] = useState<Status[]>([]);
  const [category, setCategory] = useState("");

  const counts: Record<string, number> = {};
  for (const r of reports) counts[r.status] = (counts[r.status] ?? 0) + 1;

  const visible = useMemo(
    () => reports.filter((r) => !hidden.includes(r.status as Status) && (!category || r.category === category)),
    [reports, hidden, category]
  );

  const toggle = (s: Status) => setHidden((h) => (h.includes(s) ? h.filter((x) => x !== s) : [...h, s]));

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-outline-variant/60 bg-surface-container-low">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div role="group" aria-label="Arată pe hartă" className="flex flex-wrap gap-2">
            {shown.map((s) => {
              const on = !hidden.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s)}
                  className={`flex h-9 items-center gap-2 rounded-full border px-3 font-label-lg text-label-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    on
                      ? "border-outline-variant bg-surface-container-lowest text-on-surface shadow-sm"
                      : "border-dashed border-outline-variant text-on-surface-variant opacity-60"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[s] }} />
                  {statusLabels[s]}
                  <span className="rounded-full bg-surface-container px-1.5 font-mono text-[11px]">{counts[s] ?? 0}</span>
                </button>
              );
            })}
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label className="flex-1 sm:flex-none">
              <span className="sr-only">Categorie</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-full border border-outline-variant bg-surface-container-lowest px-4 font-label-lg text-label-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary sm:w-56"
              >
                <option value="">Toate categoriile ({reports.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabels[c]}
                  </option>
                ))}
              </select>
            </label>
            <Link
              href="/"
              className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-4 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container"
            >
              <Icon node={MapPinPlus} className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">Raportează o problemă</span>
              <span className="sm:hidden">Raportează</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative isolate h-[calc(100vh-13rem)] min-h-[24rem] w-full bg-surface-container-low">
        <ReportsMap reports={visible} selection={selection} onPick={pick} photos={details} area={chisinauArea} />
        {visible.length === 0 && (
          <p className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-surface-container-lowest px-4 py-2 font-label-lg text-label-lg text-on-surface-variant shadow">
            {reports.length === 0 ? "Nicio sesizare încă" : "Nicio sesizare pentru filtrele alese"}
          </p>
        )}
      </div>
    </div>
  );
}
