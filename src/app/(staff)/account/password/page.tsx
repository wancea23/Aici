import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/ui/AuthCard";
import PasswordForm from "@/features/staff/PasswordForm";
import LogoutButton from "@/ui/LogoutButton";
import { linkClass } from "@/ui/themed-styles";
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
      <div className="mt-5 flex justify-between border-t border-outline-variant/60 pt-4 font-body-sm text-body-sm">
        {user.forcePasswordReset ? (
          <span />
        ) : (
          <Link href="/account" className={linkClass}>
            Înapoi la cont
          </Link>
        )}
        <LogoutButton />
      </div>
    </AuthCard>
  );
}
