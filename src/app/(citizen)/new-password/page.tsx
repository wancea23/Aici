import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/ui/AuthCard";
import NewPasswordForm from "@/features/citizens/NewPasswordForm";
import { linkClass } from "@/ui/themed-styles";
import { RESET_MINUTES, findPasswordReset } from "@/features/citizens/accounts";

// The token is in the address, so the page never passes it on in a Referer header.
export const metadata: Metadata = { title: "Parolă nouă", referrer: "no-referrer" };

export default async function NewPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const reset = typeof token === "string" ? await findPasswordReset(token) : null;

  if (!token || !reset) {
    return (
      <AuthCard audience="citizen" title="Link expirat">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Linkul nu mai este valabil. Expiră după {RESET_MINUTES} minute și merge o singură dată.{" "}
          <Link href="/forgot-password" className={linkClass}>
            Cere unul nou
          </Link>
          .
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      audience="citizen"
      title="Parolă nouă"
      subtitle={`Pentru ${reset.email}. După salvare te deconectăm de pe toate dispozitivele.`}
    >
      <NewPasswordForm token={token} email={reset.email} />
    </AuthCard>
  );
}
