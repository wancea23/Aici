import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/ui/AuthCard";
import ForgotPasswordForm from "@/features/citizens/ForgotPasswordForm";
import { linkClass } from "@/ui/themed-styles";
import { RESET_MINUTES } from "@/features/citizens/accounts";

export const metadata: Metadata = { title: "Parolă uitată" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      audience="citizen"
      title="Ai uitat parola?"
      subtitle={
        <>
          Scrie adresa contului și îți trimitem un link ca să alegi una nouă. Ți-ai amintit-o?{" "}
          <Link href="/sign-in" className={linkClass}>
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
