import type { Metadata } from "next";
import AuthCard from "@/ui/AuthCard";
import PasswordForm from "@/features/staff/PasswordForm";
import { findToken, roleLabels } from "@/features/staff/accounts";

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
      subtitle={`Invitație pentru ${invite.email}, cu rolul ${roleLabels[invite.role]}.`}
    >
      <PasswordForm mode="invite" token={token} email={invite.email} />
    </AuthCard>
  );
}
