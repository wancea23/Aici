import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, Mail, ShieldCheck } from "lucide";
import Icon from "@/ui/Icon";
import StaffShell from "@/features/staff/StaffShell";
import { secondaryButton } from "@/ui/themed-styles";
import { requireStaffPage } from "@/features/staff/dal";
import { roleLabels } from "@/features/staff/accounts";
import { initials } from "@/ui/format";

export const metadata: Metadata = { title: "Contul meu" };

export default async function AccountPage() {
  const { user } = await requireStaffPage("/account");

  return (
    <StaffShell user={user} title="Contul meu">
      <section className="mx-auto max-w-2xl rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-headline-sm text-headline-sm text-on-primary">
            {initials(user.email)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-headline-sm text-headline-sm text-on-surface">{user.email.split("@")[0]}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{roleLabels[user.role]}</p>
          </div>
        </div>
        <dl className="mt-5 divide-y divide-outline-variant/40 font-body-sm text-body-sm">
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="flex items-center gap-2 text-on-surface-variant">
              <Icon node={Mail} className="h-4 w-4 text-outline" />
              Email
            </dt>
            <dd className="break-all font-medium text-on-surface">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="flex items-center gap-2 text-on-surface-variant">
              <Icon node={ShieldCheck} className="h-4 w-4 text-outline" />
              Rol
            </dt>
            <dd className="font-medium text-on-surface">{roleLabels[user.role]}</dd>
          </div>
        </dl>
        <Link href="/account/password" className={`mt-4 inline-flex items-center gap-2 ${secondaryButton}`}>
          <Icon node={KeyRound} className="h-4 w-4" />
          Schimbă parola
        </Link>
      </section>
    </StaffShell>
  );
}
