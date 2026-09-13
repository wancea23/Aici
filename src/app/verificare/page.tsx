import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import ConfirmEmail from "@/components/citizen/ConfirmEmail";
import { linkClass } from "@/components/auth/ui";
import { findSignup } from "@/lib/auth/citizen";

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
          <Link href="/inregistrare" className={linkClass}>
            Înregistrează-te din nou
          </Link>{" "}
          ca să primești altul, sau{" "}
          <Link href="/conectare" className={linkClass}>
            conectează-te
          </Link>{" "}
          dacă ai confirmat deja contul.
        </p>
      </AuthCard>
    );
  }

  return <ConfirmEmail token={token} email={signup.email} />;
}
