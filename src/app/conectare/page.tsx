import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";
import { linkClass } from "@/components/auth/ui";
import { currentCitizen } from "@/lib/auth/citizen-session";
import { safeNext } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Conectare" };

export default async function CitizenLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next, "/");

  if (await currentCitizen()) redirect(next);

  return (
    <AuthCard
      audience="citizen"
      title="Conectare"
      subtitle={
        <>
          Nu ai cont?{" "}
          <Link href="/inregistrare" className={linkClass}>
            Creează unul
          </Link>
          . Poți raporta și fără cont.
        </>
      }
    >
      <LoginForm next={next} endpoint="/api/citizen/login">
        <p className="text-sm">
          <Link href="/forgot-password" className={linkClass}>
            Ai uitat parola?
          </Link>
        </p>
        <p className="text-xs text-slate-400">
          Lucrezi la primărie?{" "}
          <Link href="/login" className="hover:underline">
            Intră pe pagina personalului
          </Link>
          .
        </p>
      </LoginForm>
    </AuthCard>
  );
}
