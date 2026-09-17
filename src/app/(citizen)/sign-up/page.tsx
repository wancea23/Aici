import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthCard from "@/ui/AuthCard";
import RegisterForm from "@/features/citizens/RegisterForm";
import { linkClass } from "@/ui/styles";
import { currentCitizen } from "@/features/citizens/session";

export const metadata: Metadata = { title: "Creează cont" };

export default async function RegisterPage() {
  if (await currentCitizen()) redirect("/profile");

  return (
    <AuthCard
      audience="citizen"
      title="Creează cont"
      subtitle={
        <>
          Îți trimitem un link pe email ca să confirmi adresa. Ai deja cont?{" "}
          <Link href="/sign-in" className={linkClass}>
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
