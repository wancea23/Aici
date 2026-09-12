import type { Metadata } from "next";
import Link from "next/link";
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
        <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-slate-500">Email</dt>
          <dd className="break-all">{user.email}</dd>
          <dt className="text-slate-500">Rol</dt>
          <dd>{roleLabels[user.role]}</dd>
        </dl>
        <Link href="/cont/parola" className={`${secondaryButton} mt-4 inline-block`}>
          Schimbă parola
        </Link>
      </section>
    </main>
  );
}
