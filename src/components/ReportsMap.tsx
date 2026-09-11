"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
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

const chisinau: [number, number] = [28.8638, 47.0105];
const mapStyle = "https://tiles.openfreemap.org/styles/bright";

// The bundler breaks MapLibre's own worker lookup, see src/app/maplibre.
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export default function ReportsMap({ reports, selection, onPick }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef(new Map<string, maplibregl.Marker>());

  useEffect(() => {
    const m = new maplibregl.Map({
      container: box.current!,
      style: mapStyle,
      center: chisinau,
      zoom: 11,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: true },
    });
    m.touchZoomRotate.disableRotation();
    m.keyboard.disableRotation();
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    m.on("load", () => romanianLabels(m));
    map.current = m;

    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const added: maplibregl.Marker[] = [];
    markers.current.clear();

    for (const r of reports) {
      const el = document.createElement("div");
      el.className = "h-[18px] w-[18px] cursor-pointer rounded-full border-2 border-white";
      el.style.backgroundColor = statusColors[r.status as Status] ?? "#64748b";
      el.addEventListener("click", () => onPick(r.id));

      // Filled on first open, so the photos only load when someone looks.
      const card = new maplibregl.Popup({ offset: 12, maxWidth: "240px", closeButton: false });
      card.once("open", () => card.setDOMContent(popup(r)));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([r.lng, r.lat])
        .setPopup(card)
        .addTo(m);
      markers.current.set(r.id, marker);
      added.push(marker);
    }

    if (reports.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      for (const r of reports) bounds.extend([r.lng, r.lat]);
      m.fitBounds(bounds, { padding: 40, maxZoom: 15, animate: false });
    }

    return () => {
      for (const marker of added) marker.remove();
    };
  }, [reports, onPick]);

  useEffect(() => {
    if (selection?.from !== "list") return;
    const m = map.current;
    const marker = markers.current.get(selection.id);
    if (!m || !marker) return;

    for (const other of markers.current.values()) {
      if (other !== marker && other.getPopup()?.isOpen()) other.togglePopup();
    }
    m.flyTo({ center: marker.getLngLat(), zoom: Math.max(m.getZoom(), 15), duration: 600 });
    m.once("moveend", () => {
      if (!marker.getPopup()?.isOpen()) marker.togglePopup();
    });
  }, [selection]);

  return <div ref={box} className="h-full w-full" />;
}

// The style prefers English street names. We want the Romanian ones.
function romanianLabels(m: maplibregl.Map) {
  for (const layer of m.getStyle().layers) {
    if (layer.type !== "symbol") continue;
    const field = m.getLayoutProperty(layer.id, "text-field");
    if (field && JSON.stringify(field).includes("name")) {
      m.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", "name:ro"], ["get", "name"]]);
    }
  }
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
