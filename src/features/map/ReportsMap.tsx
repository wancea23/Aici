"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createElement } from "lucide";
import type { Report } from "@/features/reports/queries";
import {
  categoryIcons,
  categoryLabels,
  statusColors,
  statusLabels,
  type Category,
  type Status,
} from "@/features/reports/validation";
import { formatDate, howMany, timeAgo } from "@/ui/format";
import { chisinau, mapStyle, pinShape, romanianLabels } from "@/features/map/setup";

export type Selection = { id: string; from: "map" | "list" } | null;

// What a pin needs. Staff pass whole reports, the public map only these fields.
export type MapReport = Pick<Report, "id" | "category" | "status" | "lat" | "lng" | "created_at"> & {
  description?: string;
  // a group is one pin: staff get the ids grouped under it, the public map only the count
  members?: string[];
  count?: number;
};

type Props = {
  reports: MapReport[];
  selection: Selection;
  onPick: (id: string) => void;
  // off on the public map, photos are for staff only
  photos?: boolean;
  // off where the map is too small for a popup, like the profile's report sheet
  popups?: boolean;
  // the public map: frame only the reports inside this box (west, south, east, north), once,
  // so filtering pins does not move the view; controls bottom right with a locate me button
  area?: [number, number, number, number];
};

const svgNS = "http://www.w3.org/2000/svg";
// a big group would otherwise fill the popup and load every photo at once
const maxThumbs = 8;

export default function ReportsMap({ reports, selection, onPick, photos = true, popups = true, area }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const framed = useRef(false);
  // the controls are placed once, when the map is made
  const publicTools = useRef(Boolean(area));
  const map = useRef<maplibregl.Map | null>(null);
  // true after the map's first load event; m.loaded() goes false again while tiles load
  const ready = useRef(false);
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
    const corner = publicTools.current ? "bottom-right" : "top-left";
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), corner);
    if (publicTools.current) m.addControl(new maplibregl.GeolocateControl({ fitBoundsOptions: { maxZoom: 15 } }), corner);
    m.on("load", () => {
      ready.current = true;
      romanianLabels(m);
      // the credits start folded into the (i) button, open they cover half of a small map
      box.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
    });
    map.current = m;

    return () => {
      m.remove();
      map.current = null;
      ready.current = false;
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

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([r.lng, r.lat]);
      if (popups) marker.setPopup(reportPopup(r, photos));
      marker.addTo(m);
      markers.current.set(r.id, marker);
      added.push(marker);
    }

    const inside = area
      ? reports.filter((r) => r.lng >= area[0] && r.lat >= area[1] && r.lng <= area[2] && r.lat <= area[3])
      : reports;
    if (inside.length > 0 && !(area && framed.current)) {
      framed.current = true;
      const bounds = new maplibregl.LngLatBounds();
      for (const r of inside) bounds.extend([r.lng, r.lat]);
      // the box can still be growing when the map is made (its css comes in a moment later),
      // so frame the pins once it has loaded, at its real size
      const frame = () => {
        m.resize();
        m.fitBounds(bounds, {
          padding: { top: 70, bottom: 30, left: 40, right: 40 },
          maxZoom: 15,
          animate: false,
        });
      };
      if (ready.current) frame();
      else m.once("load", frame);
    }

    return () => {
      for (const marker of added) marker.remove();
    };
  }, [reports, onPick, photos, popups, area]);

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
    const fly = () => {
      m.flyTo({ center: marker.getLngLat(), zoom: Math.max(m.getZoom(), 15), duration: 600 });
      m.once("moveend", () => {
        const popup = marker.getPopup();
        if (popup && !popup.isOpen()) marker.togglePopup();
      });
    };
    // before load, wait so the first framing of the pins does not undo the flight
    if (ready.current) fly();
    else m.once("load", fly);
  }, [selection]);

  return <div ref={box} className="h-full w-full" />;
}

function icon(category: string, attrs: Record<string, string | number>) {
  return createElement(categoryIcons[category as Category] ?? categoryIcons.altul, attrs);
}

function pin(r: MapReport) {
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
function reportPopup(r: MapReport, photos: boolean) {
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
  card.once("open", () => card.setDOMContent(photos ? popup(r) : publicPopup(r)));
  return card;
}

function popup(r: MapReport) {
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
  const group = groupNote(r, r.description ? "px-3.5 pb-3" : "px-3.5 py-3");
  if (group) el.append(group);
  return el;
}

// The public card: what, how far along, and when. No photo and no description.
function publicPopup(r: MapReport) {
  const el = document.createElement("div");
  el.className = "w-64 space-y-3 p-3.5";

  const head = document.createElement("div");
  head.className = "flex items-center gap-3";
  const badge = document.createElement("div");
  badge.className = "grid h-10 w-10 flex-none place-items-center rounded-full";
  const color = statusColors[r.status as Status] ?? "#64748b";
  badge.style.backgroundColor = `${color}1f`;
  badge.style.color = color;
  badge.append(icon(r.category, { class: "h-5 w-5" }));
  const text = document.createElement("div");
  text.className = "min-w-0";
  text.append(
    line("text-[15px] font-semibold leading-tight text-slate-900", categoryLabels[r.category as Category] ?? r.category),
    line("mt-0.5 text-xs text-slate-500", "Locație aproximativă, cam 100 m")
  );
  head.append(badge, text);

  const chips = document.createElement("div");
  chips.className = "flex flex-wrap items-center gap-1.5";
  chips.append(statusChip(r.status, "border border-slate-200"));
  const total = r.count ?? 1;
  if (total > 1) {
    chips.append(
      line("rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white", `Raportată de ${howMany(total, "ori")}`)
    );
  }

  const when = line("border-t border-slate-100 pt-2.5 text-xs text-slate-500", timeAgo(r.created_at));
  when.title = formatDate(r.created_at);

  el.append(head, chips, when);
  return el;
}

// How many reports the pin stands for. Staff also get the photos of the ones grouped under it.
function groupNote(r: MapReport, place: string) {
  const total = r.members ? r.members.length + 1 : (r.count ?? 1);
  if (total < 2) return null;

  const el = document.createElement("div");
  el.className = place;
  el.append(line("text-xs font-medium text-slate-500", `Raportată de ${howMany(total, "ori")}`));
  if (r.members?.length) {
    const strip = document.createElement("div");
    strip.className = "mt-1.5 flex flex-wrap gap-1.5";
    for (const id of r.members.slice(0, maxThumbs)) {
      const link = document.createElement("a");
      link.href = `/api/media/${id}`;
      link.target = "_blank";
      link.rel = "noopener";
      const img = document.createElement("img");
      img.src = `/api/media/${id}`;
      img.alt = "";
      img.className = "h-12 w-12 rounded-md bg-slate-100 object-cover";
      link.append(img);
      strip.append(link);
    }
    const more = r.members.length - maxThumbs;
    if (more > 0) strip.append(line("grid h-12 place-items-center px-1 text-xs text-slate-500", `+${more}`));
    el.append(strip);
  }
  return el;
}

function statusChip(status: string, place = "absolute left-2.5 top-2.5") {
  const el = line(
    `${place} inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-0.5 text-xs font-medium text-slate-800 shadow-sm`,
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
