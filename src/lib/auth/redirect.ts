// Where to go after login. Only paths on this site: browsers read "//host" and "/\host"
// as another site, and they drop tabs and newlines, so "/\t/host" would become "//host".
export function safeNext(value: unknown, fallback = "/panou"): string {
  if (typeof value !== "string" || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (ch === "\\" || code < 32 || code === 127) return fallback;
  }
  return value;
}
