import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";
import { currentSession } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Autentificare" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);

  const current = await currentSession();
  if (current?.session.mfaVerified) redirect(next);
  if (current) redirect(`/login/mfa?next=${encodeURIComponent(next)}`);

  return (
    <AuthCard
      title="Autentificare"
      subtitle="Doar pentru angajații primăriei. Cetățenii raportează fără cont."
    >
      <LoginForm next={next} />
    </AuthCard>
  );
}
