import { randomBytes } from "node:crypto";
import { fail } from "@/server/http/responses";

// What an error nobody planned for turns into: a short answer with a code the person can
// quote, and the details only in the server log, under the same code.
export function unexpectedError(err: unknown, req: Request | null) {
  const code = incidentCode();
  const where = req ? `${req.method} ${new URL(req.url).pathname}` : "api";
  console.error(`[${code}] ${where} failed: ${describeError(err)}`);
  return fail(500, `A apărut o eroare pe server. Încearcă din nou. Cod: ${code}`, { code });
}

export function incidentCode() {
  return randomBytes(4).toString("hex");
}

// Name, code, message and a few stack lines. postgres.js errors also carry the query and its
// parameters, which can hold personal data, so the error object itself is never logged.
export function describeError(err: unknown) {
  if (!(err instanceof Error)) return String(err);
  const code = (err as { code?: unknown }).code;
  const head = `${err.name}${typeof code === "string" ? ` (${code})` : ""}: ${err.message}`;
  const frames = (err.stack ?? "").split("\n").slice(1, 6).join("\n");
  return frames ? `${head}\n${frames}` : head;
}
