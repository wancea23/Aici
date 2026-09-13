import { NextResponse } from "next/server";

// Auth answers must never be cached by a browser or a proxy.
export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function fail(
  status: number,
  error: string,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return json({ error, ...extra }, status, headers);
}

function waitText(sec: number) {
  if (sec < 60) return sec === 1 ? "o secundă" : `${sec} ${sec >= 20 ? "de " : ""}secunde`;
  const min = Math.ceil(sec / 60);
  return min === 1 ? "un minut" : `${min} ${min >= 20 ? "de " : ""}minute`;
}

export function tooMany(retryAfter: number) {
  return fail(
    429,
    `Prea multe încercări. Mai încearcă peste ${waitText(retryAfter)}.`,
    { retryAfter },
    { "Retry-After": String(retryAfter) }
  );
}
