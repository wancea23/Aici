import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";
import PasswordForm from "@/components/auth/PasswordForm";
import { findStaffById, findToken } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Resetare parolă" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const link = typeof token === "string" ? await findToken(token, "password_reset") : null;
  const user = link?.user_id ? await findStaffById(link.user_id) : null;

  if (!token || !user || !user.is_active) {
    return (
      <AuthCard title="Link expirat">
        <p className="text-sm text-slate-600">
          Linkul de resetare nu mai este valabil. Expiră după 15 minute și merge o singură dată.
          Cere unul nou administratorului.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Parolă nouă"
      subtitle={`Pentru ${user.email}. După salvare te autentifici din nou, cu parola nouă și a doua metodă de verificare.`}
    >
      <PasswordForm mode="reset" token={token} email={user.email} />
    </AuthCard>
  );
}
