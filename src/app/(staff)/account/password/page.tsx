import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/ui/AuthCard";
import PasswordForm from "@/features/staff/PasswordForm";
import LogoutButton from "@/ui/LogoutButton";
import { requireStaffPage } from "@/features/staff/dal";

export const metadata: Metadata = { title: "Schimbă parola" };

export default async function PasswordPage() {
  const { user } = await requireStaffPage("/account/password", { allowPasswordReset: true });

  return (
    <AuthCard
      title="Schimbă parola"
      subtitle={
        user.forcePasswordReset
          ? "Administratorul a cerut o parolă nouă pentru contul tău."
          : "După schimbare, contul se deconectează de pe celelalte dispozitive."
      }
    >
      <PasswordForm mode="change" email={user.email} />
      <div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-sm">
        {user.forcePasswordReset ? (
          <span />
        ) : (
          <Link href="/account" className="text-brand-700 hover:underline">
            Înapoi la cont
          </Link>
        )}
        <LogoutButton />
      </div>
    </AuthCard>
  );
}
