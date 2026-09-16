import type { ReportEvent } from "@/lib/reports";
import { statusColors, statusLabels, type Status } from "@/lib/validation";
import { formatDate } from "@/lib/format";

// A report's history, oldest first, starting from the moment it was sent. Used by the panel
// and by the citizen's profile, so it has no state of its own.
export default function ReportTimeline({
  createdAt,
  events,
  audience,
}: {
  createdAt: string;
  events: ReportEvent[];
  audience: "staff" | "citizen";
}) {
  return (
    <ol className="space-y-3 border-l border-slate-200 pl-4">
      <Step color="#94a3b8" title="Sesizare trimisă" at={createdAt} />
      {events.map((e) => (
        <Step
          key={e.id}
          color={statusColors[e.status as Status] ?? "#64748b"}
          title={
            e.status !== e.previous
              ? `Status: ${statusLabels[e.status as Status] ?? e.status}`
              : audience === "staff"
                ? "Mesaj pentru cetățean"
                : "Mesaj de la primărie"
          }
          at={e.at}
          by={e.by}
          note={e.note}
        />
      ))}
      {events.length === 0 && audience === "citizen" && (
        <li className="text-sm text-slate-500">Primăria nu a actualizat-o încă.</li>
      )}
    </ol>
  );
}

function Step({ color, title, at, by, note }: { color: string; title: string; at: string; by?: string; note?: string }) {
  return (
    <li className="relative">
      <span
        className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
        style={{ backgroundColor: color }}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-sm font-medium text-slate-800">{title}</span>
        <time dateTime={at} className="text-xs text-slate-400">
          {formatDate(at)}
        </time>
      </div>
      {by && <p className="text-xs text-slate-400">{by}</p>}
      {note && (
        <p className="mt-1 whitespace-pre-line break-words rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {note}
        </p>
      )}
    </li>
  );
}
