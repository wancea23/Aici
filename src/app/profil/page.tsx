import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Mail, Send } from "lucide";
import AuthCard from "@/components/auth/AuthCard";
import LogoutButton from "@/components/auth/LogoutButton";
import Icon from "@/components/Icon";
import { secondaryButton } from "@/components/auth/ui";
import { currentCitizen } from "@/lib/auth/citizen-session";

export const metadata: Metadata = { title: "Contul meu" };

export default async function ProfilePage() {
  const citizen = await currentCitizen();
  if (!citizen) redirect("/conectare?next=/profil");

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
    </AuthCard>
  );
}
