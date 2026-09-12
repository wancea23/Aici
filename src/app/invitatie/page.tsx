import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";
import PasswordForm from "@/components/auth/PasswordForm";
import { findToken, roleLabels } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Invitație" };

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invite = typeof token === "string" ? await findToken(token, "invite") : null;

  if (!token || !invite || !invite.role) {
    return (
      <AuthCard title="Invitație expirată">
        <p className="text-sm text-slate-600">
          Linkul nu mai este valabil sau a fost deja folosit. Cere o invitație nouă administratorului.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Creează-ți contul"
      subtitle={`Invitație pentru ${invite.email}, cu rolul ${roleLabels[invite.role]}. După parolă îți configurezi a doua metodă de verificare.`}
    >
      <PasswordForm mode="invite" token={token} email={invite.email} />
    </AuthCard>
  );
}
