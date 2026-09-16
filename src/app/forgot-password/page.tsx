import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import ForgotPasswordForm from "@/components/citizen/ForgotPasswordForm";
import { linkClass } from "@/components/auth/ui";
import { RESET_MINUTES } from "@/lib/auth/citizen";

export const metadata: Metadata = { title: "Parolă uitată" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      audience="citizen"
      title="Ai uitat parola?"
      subtitle={
        <>
          Scrie adresa contului și îți trimitem un link ca să alegi una nouă. Ți-ai amintit-o?{" "}
          <Link href="/conectare" className={linkClass}>
            Conectează-te
          </Link>
          .
        </>
      }
    >
      <ForgotPasswordForm minutes={RESET_MINUTES} />
    </AuthCard>
  );
}
