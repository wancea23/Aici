import { closedStatuses, type Status } from "@/lib/validation";
import { howMany } from "@/lib/format";

// Article 60 of the Administrative Code gives an authority 30 days to finish a petition.
// Terms run in calendar days, starting the day after the report.
export const ANSWER_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

const dayParts = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  timeZone: "Europe/Chisinau",
});

// The calendar day it is in Chisinau at that moment, counted from 1970.
function chisinauDay(ms: number) {
  const p = Object.fromEntries(dayParts.formatToParts(ms).map((part) => [part.type, part.value]));
  return Math.round(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)) / DAY_MS);
}

export type Deadline = { due: string; daysLeft: number };

// Null once the report is resolved or rejected.
export function answerDeadline(createdAt: string, status: string, now = Date.now()): Deadline | null {
  if (closedStatuses.includes(status as Status)) return null;
  const due = chisinauDay(new Date(createdAt).getTime()) + ANSWER_DAYS;
  // noon UTC falls on the same day in Chisinau, so formatDay prints the right date
  return { due: new Date(due * DAY_MS + DAY_MS / 2).toISOString(), daysLeft: due - chisinauDay(now) };
}

export function deadlineText(daysLeft: number) {
  if (daysLeft > 1) return `încă ${howMany(daysLeft, "zile")}`;
  if (daysLeft === 1) return "încă o zi";
  if (daysLeft === 0) return "termenul e azi";
  if (daysLeft === -1) return "depășit cu o zi";
  return `depășit cu ${howMany(-daysLeft, "zile")}`;
}
