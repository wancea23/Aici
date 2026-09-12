import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import MfaChallenge from "@/components/auth/MfaChallenge";
import MfaSetup from "@/components/auth/MfaSetup";
import LogoutButton from "@/components/auth/LogoutButton";
import { currentSession } from "@/lib/auth/session";
import { listFactors } from "@/lib/auth/mfa";
import { safeNext } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Verificare în doi pași" };

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);

  const current = await currentSession();
  if (!current) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (current.session.mfaVerified) redirect(current.user.forcePasswordReset ? "/cont/parola" : next);

  const factors = await listFactors(current.user.id);

  if (factors.length === 0) {
    return (
      <AuthCard
        title="Protejează-ți contul"
        subtitle="Pe lângă parolă, contul are nevoie de o a doua metodă de verificare. O configurezi o singură dată."
      >
        <MfaSetup mode="first" next={next} />
        <div className="mt-5 border-t border-slate-100 pt-4 text-right">
          <LogoutButton />
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Verificare în doi pași" subtitle={`Confirmă că ești tu, ${current.user.email}.`}>
      <MfaChallenge
        next={next}
        hasTotp={factors.some((f) => f.type === "totp")}
        hasPasskey={factors.some((f) => f.type === "webauthn")}
      />
    </AuthCard>
  );
}
