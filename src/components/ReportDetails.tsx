"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Report } from "@/lib/reports";
import ReportTimeline from "@/components/ReportTimeline";
import { inputClass, labelClass, primaryButton } from "@/components/auth/ui";
import { statusLabels, statuses } from "@/lib/validation";
import { answerDeadline, deadlineText } from "@/lib/deadline";
import { formatDay } from "@/lib/format";

// Opens under the picked card in the panel: the deadline, the history and the answer form.
export default function ReportDetails({ report }: { report: Report }) {
  const deadline = answerDeadline(report.created_at, report.status);

  return (
    <div className="mt-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {deadline && (
        <p className="text-sm text-slate-600" suppressHydrationWarning>
          Termen de răspuns <span className="font-medium text-slate-800">{formatDay(deadline.due)}</span>,{" "}
          <span className={deadline.daysLeft < 0 ? "font-medium text-red-700" : ""}>
            {deadlineText(deadline.daysLeft)}
          </span>
        </p>
      )}
      <ReportTimeline createdAt={report.created_at} events={report.events} audience="staff" />
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
      ? "bg-red-50 text-red-700"
      : deadline.daysLeft <= 5
        ? "bg-amber-50 text-amber-800"
        : "bg-slate-100 text-slate-600";
  return (
    <span suppressHydrationWarning className={`mr-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
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
      router.push("/login?next=/panou");
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
    <form onSubmit={onSubmit} className="space-y-3 border-t border-slate-100 pt-4">
      <div>
        <label htmlFor={`status-${report.id}`} className={labelClass}>
          Status
        </label>
        <select
          id={`status-${report.id}`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={`bg-white ${inputClass}`}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`note-${report.id}`} className={labelClass}>
          Mesaj pentru cetățean
        </label>
        <textarea
          id={`note-${report.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder={status === "respins" ? "Motivul respingerii" : "Opțional"}
          className={`resize-y ${inputClass}`}
        />
        <p className={`mt-1 text-xs ${needsReason ? "text-amber-800" : "text-slate-500"}`}>
          {needsReason
            ? "La respingere scrie motivul. Cetățeanul îl vede."
            : "Cetățenii care au raportat din cont primesc un email și citesc mesajul în cont."}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || nothingNew || needsReason} className={primaryButton}>
        {busy ? "Se salvează..." : "Salvează"}
      </button>
    </form>
  );
}
