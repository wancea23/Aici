"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Report } from "@/lib/reports";
import {
  categoryLabels,
  statusColors,
  statusLabels,
  type Category,
  type Status,
} from "@/lib/validation";
import { formatDate } from "@/lib/format";

export type Selection = { id: string; from: "map" | "list" } | null;

type Props = {
  reports: Report[];
  selection: Selection;
  onPick: (id: string) => void;
};

const chisinau: L.LatLngTuple = [47.0105, 28.8638];

export default function ReportsMap({ reports, selection, onPick }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef(new Map<string, L.CircleMarker>());

  useEffect(() => {
    const m = L.map(box.current!).setView(chisinau, 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(m);
    map.current = m;

    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const layer = L.layerGroup().addTo(m);
    markers.current.clear();

    for (const r of reports) {
      const marker = L.circleMarker([r.lat, r.lng], {
        radius: 8,
        color: "#fff",
        weight: 2,
        fillColor: statusColors[r.status as Status] ?? "#64748b",
        fillOpacity: 1,
      })
        .bindPopup(() => popup(r), { maxWidth: 240 })
        .on("click", () => onPick(r.id))
        .addTo(layer);
      markers.current.set(r.id, marker);
    }

    if (reports.length > 0) {
      const bounds = L.latLngBounds(reports.map((r) => [r.lat, r.lng] as L.LatLngTuple));
      m.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }

    return () => {
      layer.remove();
    };
  }, [reports, onPick]);

  useEffect(() => {
    if (selection?.from !== "list") return;
    const m = map.current;
    const marker = markers.current.get(selection.id);
    if (!m || !marker) return;

    m.flyTo(marker.getLatLng(), Math.max(m.getZoom(), 16), { duration: 0.6 });
    m.once("moveend", () => marker.openPopup());
  }, [selection]);

  return <div ref={box} className="h-full w-full" />;
}

function popup(r: Report) {
  const el = document.createElement("div");
  el.className = "w-52";

  const img = document.createElement("img");
  img.src = `/api/media/${r.id}`;
  img.alt = "";
  img.className = "mb-2 h-28 w-full rounded-md bg-slate-100 object-cover";
  el.append(img);

  const status = statusLabels[r.status as Status] ?? r.status;
  el.append(
    line("text-sm font-medium text-slate-900", categoryLabels[r.category as Category] ?? r.category),
    line("text-xs text-slate-500", `${status}, ${formatDate(r.created_at)}`)
  );
  if (r.description) {
    el.append(line("mt-1 line-clamp-4 text-sm text-slate-600", r.description));
  }
  return el;
}

// Descriptions come from citizens, so they go in as text and never as HTML.
function line(className: string, text: string) {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = text;
  return el;
}
