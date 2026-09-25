import type { CitizenReport } from "@/features/reports/queries";

// The civic score is worked out from the citizen's own reports every time the profile loads.
// Nothing is stored, so there is no counter anyone could bump by hand, and a report the city
// hall rejects earns nothing, so sending junk doesn't pay.
export const POINTS = { accepted: 10, inWork: 5, resolved: 15 } as const;

export const levels = [
  { level: 1, min: 0, title: "Vecin atent" },
  { level: 2, min: 30, title: "Observator" },
  { level: 3, min: 80, title: "Santinelă de cartier" },
  { level: 4, min: 160, title: "Gardian civic" },
  { level: 5, min: 300, title: "Pilon al orașului" },
] as const;

export type BadgeId = "first" | "firstFix" | "sharpEye" | "explorer" | "cleanCity" | "steady";

export type Badge = { id: BadgeId; title: string; hint: string; earned: boolean };

type Scored = Pick<CitizenReport, "status" | "events" | "category" | "created_at">;

// What one report is worth right now.
export function reportPoints(r: Scored) {
  if (r.status === "respins") return 0;
  let points = POINTS.accepted;
  const reachedWork = r.status === "in_lucru" || r.status === "rezolvat" || r.events.some((e) => e.status === "in_lucru");
  if (reachedWork) points += POINTS.inWork;
  if (r.status === "rezolvat") points += POINTS.resolved;
  return points;
}

const monthOf = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "2-digit", timeZone: "Europe/Chisinau" });

export function civicScore(reports: Scored[]) {
  const points = reports.reduce((sum, r) => sum + reportPoints(r), 0);
  const current = [...levels].reverse().find((l) => points >= l.min)!;
  const next = levels.find((l) => l.min > points) ?? null;
  // share of the way from this level to the next, full once the last level is reached
  const progress = next ? (points - current.min) / (next.min - current.min) : 1;

  const accepted = reports.filter((r) => r.status !== "respins");
  const resolved = reports.filter((r) => r.status === "rezolvat").length;
  const categories = new Set(accepted.map((r) => r.category)).size;
  const months = new Set(accepted.map((r) => monthOf.format(new Date(r.created_at)))).size;

  const badges: Badge[] = [
    { id: "first", title: "Prima sesizare", hint: "O sesizare acceptată", earned: accepted.length >= 1 },
    { id: "firstFix", title: "Prima reparație", hint: "O problemă rezolvată", earned: resolved >= 1 },
    { id: "sharpEye", title: "Ochi de vultur", hint: "5 sesizări acceptate", earned: accepted.length >= 5 },
    { id: "explorer", title: "Explorator", hint: "3 categorii diferite", earned: categories >= 3 },
    { id: "cleanCity", title: "Oraș mai bun", hint: "5 probleme rezolvate", earned: resolved >= 5 },
    { id: "steady", title: "Constanță", hint: "Sesizări în 3 luni diferite", earned: months >= 3 },
  ];

  return { points, level: current, next, progress, toNext: next ? next.min - points : 0, badges };
}

export type CivicScore = ReturnType<typeof civicScore>;
