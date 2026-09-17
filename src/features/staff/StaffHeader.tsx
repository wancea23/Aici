import Link from "next/link";
import LogoutButton from "@/ui/LogoutButton";
import type { StaffUser } from "@/features/staff/session";

export default function StaffHeader({ user, subtitle }: { user: StaffUser; subtitle: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <Link href="/dashboard" className="text-2xl font-semibold tracking-tight text-brand-700 transition-colors hover:text-brand-800">
          Aici
        </Link>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
        <Link href="/dashboard" className="transition-colors hover:text-slate-800">
          Panou
        </Link>
        {user.role === "admin" && (
          <Link href="/admin" className="transition-colors hover:text-slate-800">
            Administrare
          </Link>
        )}
        <Link href="/account" title={user.email} className="transition-colors hover:text-slate-800">
          Contul meu
        </Link>
        <Link href="/" className="transition-colors hover:text-slate-800">
          Raportează
        </Link>
        <LogoutButton />
      </nav>
    </header>
  );
}
