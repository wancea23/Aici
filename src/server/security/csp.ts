// Content-Security-Policy for every page (SR-07). ZAP flagged its absence on every page,
// locally and on the beta. Built per request in src/proxy.ts, because the script rule carries a
// fresh nonce: Next.js reads the nonce back from the request's CSP header and puts it on its own
// scripts, and the root layout puts it on the theme script. An injected <script> has no nonce
// and doesn't run.
//
// What each source is for:
// - tiles.openfreemap.org: the map style, tiles, glyphs and sprites (features/map/setup.ts)
// - worker-src 'self': the MapLibre worker (src/app/maplibre) and the ALTCHA one (src/app/altcha)
// - blob: and data: in img-src: the photo preview before upload, and MapLibre's sprites
// - style-src: stylesheets from our own origin, and a <style> tag only with the nonce. ALTCHA is
//   loaded from its external build for this, with its CSS as a file (ui/AltchaWidget.tsx).
// - 'unsafe-inline' in style-src-attr only: the React style={{}} attributes (progress bars, status
//   colours, the ALTCHA theme). An attribute holds declarations for one element, no selectors and
//   no code, so it can't be used to read the page the way an injected <style> tag can.
// - 'unsafe-eval' only in development, where React needs it for its debugging tools.
export const MAP_ORIGIN = "https://tiles.openfreemap.org";

export function buildCsp(nonce: string, dev = process.env.NODE_ENV !== "production") {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", `'nonce-${nonce}'`],
    "style-src-elem": ["'self'", `'nonce-${nonce}'`],
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", MAP_ORIGIN],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", MAP_ORIGIN],
    "worker-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}

// 128 random bits, base64. A new one for every response.
export function newNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
