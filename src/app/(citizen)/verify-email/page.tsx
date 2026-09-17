import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/ui/AuthCard";
import ConfirmEmail from "@/features/citizens/ConfirmEmail";
import { linkClass } from "@/ui/styles";
import { findSignup } from "@/features/citizens/accounts";

export const metadata: Metadata = { title: "Confirmare email" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const signup = typeof token === "string" ? await findSignup(token) : null;

  if (!token || !signup) {
    return (
      <AuthCard audience="citizen" title="Link expirat">
        <p className="text-sm text-slate-600">
          Linkul nu mai este valabil sau a fost deja folosit.{" "}
          <Link href="/sign-up" className={linkClass}>
            Înregistrează-te din nou
          </Link>{" "}
          ca să primești altul, sau{" "}
          <Link href="/sign-in" className={linkClass}>
            conectează-te
          </Link>{" "}
          dacă ai confirmat deja contul.
        </p>
      </AuthCard>
    );
  }

  return <ConfirmEmail token={token} email={signup.email} />;
}
