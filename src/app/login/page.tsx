import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";
import { linkClass } from "@/components/auth/ui";
import { currentSession } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/redirect";

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
        <p className="text-xs text-slate-400">
          Ai uitat parola? Cere administratorului un link de resetare.
        </p>
      </LoginForm>
      {/* citizens who follow "Panou primărie" end up here, so point them to their own login */}
      <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        Ești cetățean? Contul tău nu merge aici.{" "}
        <Link href="/conectare" className={linkClass}>
          Conectează-te ca cetățean
        </Link>
      </p>
    </AuthCard>
  );
}
