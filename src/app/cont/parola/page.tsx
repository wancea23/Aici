import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import PasswordForm from "@/components/auth/PasswordForm";
import LogoutButton from "@/components/auth/LogoutButton";
import { requireStaffPage } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Schimbă parola" };

export default async function PasswordPage() {
  const { user } = await requireStaffPage("/cont/parola", { allowPasswordReset: true });

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
          <Link href="/cont" className="text-brand-700 hover:underline">
            Înapoi la cont
          </Link>
        )}
        <LogoutButton />
      </div>
    </AuthCard>
  );
}
