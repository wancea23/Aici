"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Info } from "lucide";
import Icon from "@/ui/Icon";
import type { Report } from "@/features/reports/queries";
import ReportTimeline from "@/features/reports/ReportTimeline";
import { inputClass, labelClass, primaryButton } from "@/ui/themed-styles";
import { statusLabels, statuses } from "@/features/reports/validation";
import { answerDeadline, deadlineText } from "@/features/reports/deadline";
import { formatDay } from "@/ui/format";

// inputClass has a fixed height, a textarea needs its own
const textareaClass =
  "w-full resize-y rounded-lg border-none bg-surface-container-low px-space-md py-2.5 text-body-md text-on-surface " +
  "placeholder:text-outline outline-none transition-all focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/10";

// Opens under the picked card in the panel: the deadline, the history and the answer form.
export default function ReportDetails({ report }: { report: Report }) {
  const deadline = answerDeadline(report.created_at, report.status);
  const late = deadline !== null && deadline.daysLeft < 0;

  return (
    <div className="mt-2 space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm">
      {deadline && (
        <div
          suppressHydrationWarning
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${late ? "bg-error-container text-on-error-container" : "bg-surface-container-low text-on-surface"}`}
        >
          <Icon node={CalendarClock} className="h-5 w-5 shrink-0" />
          <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 font-body-sm text-body-sm">
            <span>
              Termen de răspuns <span className="font-semibold">{formatDay(deadline.due)}</span>
            </span>
            <span className="font-semibold">{deadlineText(deadline.daysLeft)}</span>
          </div>
        </div>
      )}
      <div>
        <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Istoric</p>
        <ReportTimeline createdAt={report.created_at} events={report.events} audience="staff" />
      </div>
      {/* a fresh form once the saved change comes back from the server */}
      <StatusForm key={`${report.status}:${report.events.length}`} report={report} />
    </div>
  );
}

// Days left to answer, on the card itself. Nothing once the report is closed.
export function DeadlinePill({ createdAt, status }: { createdAt: string; status: string }) {
  const deadline = answerDeadline(createdAt, status);
  if (!deadline) return null;
  const tone =
    deadline.daysLeft < 0
      ? "bg-error-container text-on-error-container"
      : deadline.daysLeft <= 5
        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
        : "bg-surface-container text-on-surface-variant";
  return (
    <span suppressHydrationWarning className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {deadlineText(deadline.daysLeft)}
    </span>
  );
}

function StatusForm({ report }: { report: Report }) {
  const router = useRouter();
  const [status, setStatus] = useState(report.status);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const nothingNew = status === report.status && note.trim() === "";
  const needsReason = status === "respins" && note.trim() === "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (nothingNew || needsReason) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/reports/${report.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    }).catch(() => null);

    if (res?.status === 401) {
      router.push("/login?next=/dashboard");
      return;
    }
    if (!res?.ok) {
      const data = await res?.json().catch(() => null);
      setError(data?.error ?? "Nu s-a putut salva. Încearcă din nou.");
      setBusy(false);
      return;
    }
    setNote("");
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border-t border-outline-variant/60 pt-4">
      <div>
        <label htmlFor={`status-${report.id}`} className={labelClass}>
          Status
        </label>
        <select
          id={`status-${report.id}`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={inputClass}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={`note-${report.id}`} className={labelClass}>
            Mesaj pentru cetățean
          </label>
          <span className="font-label-md text-label-md text-on-surface-variant">
            {status === "respins" ? "Obligatoriu" : "Opțional"}
          </span>
        </div>
        <textarea
          id={`note-${report.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder={status === "respins" ? "Motivul respingerii" : "Ce se întâmplă cu sesizarea"}
          className={textareaClass}
        />
        <p
          className={`mt-1.5 flex gap-1.5 font-body-sm text-body-sm ${needsReason ? "text-amber-800 dark:text-amber-300" : "text-on-surface-variant"}`}
        >
          <Icon node={Info} className="mt-0.5 h-4 w-4 shrink-0" />
          {needsReason
            ? "La respingere scrie motivul. Cetățeanul îl vede."
            : "Cetățenii care au raportat din cont primesc un email și citesc mesajul în cont."}
        </p>
      </div>
      {error && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || nothingNew || needsReason} className={primaryButton}>
        {busy ? "Se salvează..." : "Salvează"}
      </button>
    </form>
  );
}
