"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createElement } from "lucide";
import type { Report } from "@/lib/reports";
import {
  categoryIcons,
  categoryLabels,
  statusColors,
  statusLabels,
  type Category,
  type Status,
} from "@/lib/validation";
import { formatDate, timeAgo } from "@/lib/format";

export type Selection = { id: string; from: "map" | "list" } | null;

type Props = {
  reports: Report[];
  selection: Selection;
  onPick: (id: string) => void;
};

const chisinau: [number, number] = [28.8638, 47.0105];
const mapStyle = "https://tiles.openfreemap.org/styles/bright";
const pinShape = "M16 38C12 33 3 24 3 15a13 13 0 1 1 26 0c0 9-9 18-13 23z";
const svgNS = "http://www.w3.org/2000/svg";

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
      const el = pin(r);
      el.addEventListener("click", () => onPick(r.id));

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([r.lng, r.lat])
        .setPopup(reportPopup(r))
        .addTo(m);
      markers.current.set(r.id, marker);
      added.push(marker);
    }

    if (reports.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      for (const r of reports) bounds.extend([r.lng, r.lat]);
      m.fitBounds(bounds, {
        padding: { top: 70, bottom: 30, left: 40, right: 40 },
        maxZoom: 15,
        animate: false,
      });
    }

    return () => {
      for (const marker of added) marker.remove();
    };
  }, [reports, onPick]);

  // The picked report stays raised on the map, wherever it was picked.
  useEffect(() => {
    for (const [id, marker] of markers.current) {
      marker.getElement().classList.toggle("is-selected", id === selection?.id);
    }
  }, [selection, reports]);

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

function icon(category: string, attrs: Record<string, string | number>) {
  return createElement(categoryIcons[category as Category] ?? categoryIcons.altul, attrs);
}

function pin(r: Report) {
  const el = document.createElement("div");
  el.className = "report-pin";
  el.title = `${categoryLabels[r.category as Category] ?? r.category}, ${statusLabels[r.status as Status] ?? r.status}`;
  el.style.setProperty("--pin", statusColors[r.status as Status] ?? "#64748b");

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 32 40");
  svg.setAttribute("width", "32");
  svg.setAttribute("height", "40");

  const shape = document.createElementNS(svgNS, "path");
  shape.setAttribute("class", "report-pin-shape");
  shape.setAttribute("d", pinShape);

  svg.append(shape, icon(r.category, { x: 8, y: 7, width: 16, height: 16, "stroke-width": 2.5 }));
  el.append(svg);
  return el;
}

// Filled on first open, so the photos only load when someone looks.
function reportPopup(r: Report) {
  const card = new maplibregl.Popup({
    maxWidth: "none",
    closeButton: false,
    // The pin's tip is on the point and the open pin is scaled up, so a popup above has to clear it.
    offset: {
      center: [0, -25],
      top: [0, 4],
      "top-left": [0, 4],
      "top-right": [0, 4],
      bottom: [0, -54],
      "bottom-left": [0, -54],
      "bottom-right": [0, -54],
      left: [22, -25],
      right: [-22, -25],
    },
  });
  card.once("open", () => card.setDOMContent(popup(r)));
  return card;
}

function popup(r: Report) {
  const el = document.createElement("div");
  el.className = "w-64";

  const media = document.createElement("div");
  media.className = "relative";
  const img = document.createElement("img");
  img.src = `/api/media/${r.id}`;
  img.alt = "";
  img.className = "aspect-[4/3] w-full bg-slate-100 object-cover";

  // Dark fade under the title so the white text reads on any photo.
  const shade = document.createElement("div");
  shade.className =
    "absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent";

  const caption = document.createElement("div");
  caption.className = "absolute inset-x-3 bottom-2.5 text-white";
  const title = line(
    "flex items-center gap-1.5 text-[15px] font-semibold",
    categoryLabels[r.category as Category] ?? r.category
  );
  title.prepend(icon(r.category, { class: "h-4 w-4 flex-none text-white/80" }));
  const when = line("text-xs text-white/75", timeAgo(r.created_at));
  when.title = formatDate(r.created_at);
  caption.append(title, when);

  media.append(img, shade, statusChip(r.status), caption);
  el.append(media);
  if (r.description) {
    el.append(line("px-3.5 py-3 line-clamp-3 text-sm leading-snug text-slate-600", r.description));
  }
  return el;
}

function statusChip(status: string) {
  const el = line(
    "absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-0.5 text-xs font-medium text-slate-800 shadow-sm",
    statusLabels[status as Status] ?? status
  );
  const dot = document.createElement("span");
  dot.className = "h-2 w-2 rounded-full";
  dot.style.backgroundColor = statusColors[status as Status] ?? "#64748b";
  el.prepend(dot);
  return el;
}

// Descriptions come from citizens, so they go in as text and never as HTML.
function line(className: string, text: string) {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = text;
  return el;
}
