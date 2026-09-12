import type { Metadata } from "next";
import StaffHeader from "@/components/auth/StaffHeader";
import AccountSettings from "@/components/auth/AccountSettings";
import { requireStaffPage } from "@/lib/auth/dal";
import { listFactors, recoveryCodesLeft } from "@/lib/auth/mfa";
import { roleLabels } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Contul meu" };

export default async function AccountPage() {
  const { user } = await requireStaffPage("/cont");
  const [factors, codesLeft] = await Promise.all([listFactors(user.id), recoveryCodesLeft(user.id)]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <StaffHeader user={user} subtitle="Contul meu" />
      <AccountSettings
        email={user.email}
        role={roleLabels[user.role]}
        factors={factors}
        codesLeft={codesLeft}
      />
    </main>
  );
}
