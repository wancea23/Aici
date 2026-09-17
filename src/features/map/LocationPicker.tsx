"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createElement } from "lucide";
import { chisinau, mapStyle, pinShape, romanianLabels } from "@/features/map/setup";
import { categoryIcons, serviceArea, type Category } from "@/features/reports/validation";

export type Coords = { lat: number; lng: number };

type Props = {
  value: Coords | null;
  category: Category;
  // bumped by the form when the map should fly to the value, like after a GPS fix
  focus: number;
  onPick: (coords: Coords) => void;
};

const svgNS = "http://www.w3.org/2000/svg";
const brand = "#0d9488";

// The report's pin on a small map. Dragging it or tapping the map moves it, since the photo
// may come from the gallery and show a place other than where the phone is now.
export default function LocationPicker({ value, category, focus, onPick }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const start = useRef(value);
  const pick = useRef(onPick);

  useEffect(() => {
    pick.current = onPick;
  });

  useEffect(() => {
    const at = start.current;
    const m = new maplibregl.Map({
      container: box.current!,
      style: mapStyle,
      center: at ? [at.lng, at.lat] : chisinau,
      zoom: at ? 16 : 11,
      maxBounds: [
        [serviceArea.west, serviceArea.south],
        [serviceArea.east, serviceArea.north],
      ],
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: true },
    });
    m.touchZoomRotate.disableRotation();
    m.keyboard.disableRotation();
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    m.on("load", () => {
      romanianLabels(m);
      // the credits start open and cover a quarter of this small map, the (i) button still shows them
      m.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
    });
    m.on("click", (e) => pick.current({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    map.current = m;

    return () => {
      m.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !value) return;
    if (marker.current) {
      marker.current.setLngLat([value.lng, value.lat]);
      return;
    }
    const pin = new maplibregl.Marker({ element: pinElement(), anchor: "bottom", draggable: true })
      .setLngLat([value.lng, value.lat])
      .addTo(m);
    pin.on("dragend", () => {
      const p = pin.getLngLat();
      pick.current({ lat: p.lat, lng: p.lng });
    });
    marker.current = pin;
  }, [value]);

  useEffect(() => {
    const el = marker.current?.getElement();
    const svg = el?.querySelector("svg");
    if (!svg) return;
    svg.querySelector(".picker-icon")?.remove();
    svg.append(categoryIcon(category));
  }, [category, value]);

  useEffect(() => {
    const at = start.current;
    if (focus === 0 && at) return;
    const m = map.current;
    if (!m || !value) return;
    m.flyTo({ center: [value.lng, value.lat], zoom: Math.max(m.getZoom(), 16), duration: 600 });
    // only the focus bump moves the camera, a drag or a tap leaves it where the person put it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  return <div ref={box} className="h-full w-full" />;
}

function pinElement() {
  const el = document.createElement("div");
  el.className = "report-pin picker-pin";
  el.title = "Trage pinul unde e problema";
  el.style.setProperty("--pin", brand);

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 32 40");
  svg.setAttribute("width", "40");
  svg.setAttribute("height", "50");
  const shape = document.createElementNS(svgNS, "path");
  shape.setAttribute("class", "report-pin-shape");
  shape.setAttribute("d", pinShape);
  svg.append(shape);
  el.append(svg);
  return el;
}

function categoryIcon(category: Category) {
  return createElement(categoryIcons[category], {
    class: "picker-icon",
    x: 8,
    y: 7,
    width: 16,
    height: 16,
    "stroke-width": 2.5,
  });
}
