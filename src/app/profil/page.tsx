import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Inbox, Mail, Send } from "lucide";
import AuthCard from "@/components/auth/AuthCard";
import LogoutButton from "@/components/auth/LogoutButton";
import Icon from "@/components/Icon";
import { secondaryButton } from "@/components/auth/ui";
import { currentCitizen } from "@/lib/auth/citizen-session";
import { listReportsForCitizen } from "@/lib/reports";
import { categoryLabels, statusColors, statusInk, statusLabels, type Category, type Status } from "@/lib/validation";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Contul meu" };

export default async function ProfilePage() {
  const citizen = await currentCitizen();
  if (!citizen) redirect("/conectare?next=/profil");

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
            <li key={r.id} className="flex items-center gap-3 py-3">
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
                <time dateTime={r.created_at} className="text-xs text-slate-400" suppressHydrationWarning>
                  {timeAgo(r.created_at)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AuthCard>
  );
}
