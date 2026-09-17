import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, ChevronDown, Inbox, Mail, MessageSquare, Send } from "lucide";
import AuthCard from "@/ui/AuthCard";
import LogoutButton from "@/ui/LogoutButton";
import Icon from "@/ui/Icon";
import ReportTimeline from "@/features/reports/ReportTimeline";
import { secondaryButton } from "@/ui/styles";
import { currentCitizen } from "@/features/citizens/session";
import { listReportsForCitizen } from "@/features/reports/queries";
import { categoryLabels, statusColors, statusInk, statusLabels, type Category, type Status } from "@/features/reports/validation";
import { timeAgo } from "@/ui/format";

export const metadata: Metadata = { title: "Contul meu" };

export default async function ProfilePage() {
  const citizen = await currentCitizen();
  if (!citizen) redirect("/sign-in?next=/profile");

  const reports = await listReportsForCitizen(citizen.id);

  return (
    <AuthCard audience="citizen" title="Contul meu">
      <dl className="divide-y divide-slate-100 text-sm">
        <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
          <dt className="flex items-center gap-2 text-slate-500">
            <Icon node={Mail} className="h-4 w-4 text-slate-400" />
            Email
          </dt>
          <dd className="break-all font-medium text-slate-900">{citizen.email}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
          <dt className="flex items-center gap-2 text-slate-500">
            <Icon node={BadgeCheck} className="h-4 w-4 text-slate-400" />
            Stare
          </dt>
          <dd className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <Icon node={BadgeCheck} className="h-3.5 w-3.5" />
            Confirmat
          </dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link href="/" className={`inline-flex items-center gap-2 ${secondaryButton}`}>
          <Icon node={Send} className="h-4 w-4" />
          Raportează o problemă
        </Link>
        <LogoutButton endpoint="/api/citizen/logout" to="/" className={secondaryButton} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Sesizările mele</h2>
      {reports.length === 0 ? (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 text-center text-slate-400">
          <Icon node={Inbox} className="h-6 w-6" />
          <p className="text-sm text-slate-500">Nu ai trimis nicio sesizare încă.</p>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {reports.map((r) => (
            <li key={r.id}>
              {/* a tap before hydration may already have opened it */}
              <details className="group" suppressHydrationWarning>
                <summary className="flex cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
                  <img
                    src={`/api/media/${r.id}`}
                    alt=""
                    loading="lazy"
                    className="h-12 w-12 flex-none rounded-lg bg-slate-100 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {categoryLabels[r.category as Category] ?? r.category}
                      </span>
                      <span
                        className="inline-flex flex-none items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium"
                        style={{ color: statusInk[r.status as Status] ?? "#475569" }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: statusColors[r.status as Status] ?? "#64748b" }}
                        />
                        {statusLabels[r.status as Status] ?? r.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {r.description || "Fără descriere"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <time dateTime={r.created_at} className="whitespace-nowrap" suppressHydrationWarning>
                        {timeAgo(r.created_at)}
                      </time>
                      {r.events.some((e) => e.note) && (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-brand-700">
                          <Icon node={MessageSquare} className="h-3.5 w-3.5" />
                          Răspuns
                        </span>
                      )}
                    </div>
                  </div>
                  <Icon
                    node={ChevronDown}
                    className="h-4 w-4 flex-none text-slate-400 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="pb-4 pl-[3.75rem] pr-7">
                  <ReportTimeline createdAt={r.created_at} events={r.events} audience="citizen" />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </AuthCard>
  );
}
