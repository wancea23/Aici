import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthCard from "@/ui/AuthCard";
import LoginForm from "@/ui/LoginForm";
import { linkClass } from "@/ui/themed-styles";
import { currentSession } from "@/features/staff/session";
import { safeNext } from "@/server/http/redirect";

export const metadata: Metadata = { title: "Autentificare" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);

  if (await currentSession()) redirect(next);

  return (
    <AuthCard title="Autentificare" subtitle="Doar pentru angajații primăriei.">
      <LoginForm next={next}>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Ai uitat parola? Cere administratorului un link de resetare.
        </p>
      </LoginForm>
      {/* citizens who follow "Panou primărie" end up here, so point them to their own login */}
      <p className="mt-5 rounded-xl bg-surface-container-low p-4 font-body-sm text-body-sm text-on-surface-variant">
        Ești cetățean? Contul tău nu merge aici.{" "}
        <Link href="/sign-in" className={linkClass}>
          Conectează-te ca cetățean
        </Link>
      </p>
    </AuthCard>
  );
}
