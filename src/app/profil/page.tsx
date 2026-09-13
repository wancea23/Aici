import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import LogoutButton from "@/components/auth/LogoutButton";
import { secondaryButton } from "@/components/auth/ui";
import { currentCitizen } from "@/lib/auth/citizen-session";

export const metadata: Metadata = { title: "Contul meu" };

export default async function ProfilePage() {
  const citizen = await currentCitizen();
  if (!citizen) redirect("/conectare?next=/profil");

  return (
    <AuthCard audience="citizen" title="Contul meu">
      <dl className="grid grid-cols-[5rem_1fr] gap-y-2 text-sm">
        <dt className="text-slate-500">Email</dt>
        <dd className="break-all">{citizen.email}</dd>
        <dt className="text-slate-500">Stare</dt>
        <dd>Confirmat</dd>
      </dl>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link href="/" className={secondaryButton}>
          Raportează o problemă
        </Link>
        <LogoutButton endpoint="/api/citizen/logout" to="/" className={secondaryButton} />
      </div>
    </AuthCard>
  );
}
