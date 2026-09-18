import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthCard from "@/ui/AuthCard";
import LoginForm from "@/ui/LoginForm";
import { linkClass } from "@/ui/themed-styles";
import { currentCitizen } from "@/features/citizens/session";
import { safeNext } from "@/server/http/redirect";

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
          <Link href="/sign-up" className={linkClass}>
            Creează unul
          </Link>
          <span className="mt-0.5 block text-outline">Poți raporta și fără cont.</span>
        </>
      }
    >
      <LoginForm next={next} endpoint="/api/citizen/login">
        <Link href="/forgot-password" className={`${linkClass} block py-1`}>
          Ai uitat parola?
        </Link>
        <p className="mt-space-lg pt-space-md font-body-sm text-body-sm text-on-surface-variant">
          Lucrezi la primărie?{" "}
          <Link
            href="/login"
            className="font-label-md text-label-md text-on-surface underline decoration-outline-variant underline-offset-4 transition-colors hover:text-primary"
          >
            Intră pe pagina personalului
          </Link>
          .
        </p>
      </LoginForm>
    </AuthCard>
  );
}
