import * as maplibregl from "maplibre-gl";

// Shared by every map in the app. Browser only: import it from components loaded with ssr: false.

// The bundler breaks MapLibre's own worker lookup, see src/app/maplibre.
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export const mapStyle = "https://tiles.openfreemap.org/styles/bright";
export const chisinau: [number, number] = [28.8638, 47.0105];
export const pinShape = "M16 38C12 33 3 24 3 15a13 13 0 1 1 26 0c0 9-9 18-13 23z";

// The style prefers English street names. We want the Romanian ones.
export function romanianLabels(m: maplibregl.Map) {
  for (const layer of m.getStyle().layers) {
    if (layer.type !== "symbol") continue;
    const field = m.getLayoutProperty(layer.id, "text-field");
    if (field && JSON.stringify(field).includes("name")) {
      m.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", "name:ro"], ["get", "name"]]);
    }
  }
}
