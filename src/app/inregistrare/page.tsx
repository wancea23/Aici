import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/citizen/RegisterForm";
import { linkClass } from "@/components/auth/ui";
import { currentCitizen } from "@/lib/auth/citizen-session";

export const metadata: Metadata = { title: "Creează cont" };

export default async function RegisterPage() {
  if (await currentCitizen()) redirect("/profil");

  return (
    <AuthCard
      audience="citizen"
      title="Creează cont"
      subtitle={
        <>
          Îți trimitem un link pe email ca să confirmi adresa. Ai deja cont?{" "}
          <Link href="/conectare" className={linkClass}>
            Conectează-te
          </Link>
          .
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
