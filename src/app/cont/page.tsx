import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, Mail, ShieldCheck } from "lucide";
import Icon from "@/components/Icon";
import StaffHeader from "@/components/auth/StaffHeader";
import { secondaryButton } from "@/components/auth/ui";
import { requireStaffPage } from "@/lib/auth/dal";
import { roleLabels } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Contul meu" };

export default async function AccountPage() {
  const { user } = await requireStaffPage("/cont");

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <StaffHeader user={user} subtitle="Contul meu" />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Date</h2>
        <dl className="mt-3 divide-y divide-slate-100 text-sm">
          <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
            <dt className="flex items-center gap-2 text-slate-500">
              <Icon node={Mail} className="h-4 w-4 text-slate-400" />
              Email
            </dt>
            <dd className="break-all font-medium text-slate-900">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
            <dt className="flex items-center gap-2 text-slate-500">
              <Icon node={ShieldCheck} className="h-4 w-4 text-slate-400" />
              Rol
            </dt>
            <dd className="font-medium text-slate-900">{roleLabels[user.role]}</dd>
          </div>
        </dl>
        <Link href="/cont/parola" className={`mt-4 inline-flex items-center gap-2 ${secondaryButton}`}>
          <Icon node={KeyRound} className="h-4 w-4" />
          Schimbă parola
        </Link>
      </section>
    </main>
  );
}
