import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import type { StaffUser } from "@/lib/auth/session";

export default function StaffHeader({ user, subtitle }: { user: StaffUser; subtitle: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <Link href="/panou" className="text-2xl font-semibold tracking-tight text-brand-700">
          Aici
        </Link>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
        <Link href="/panou" className="hover:text-slate-800">
          Panou
        </Link>
        {user.role === "admin" && (
          <Link href="/admin" className="hover:text-slate-800">
            Administrare
          </Link>
        )}
        <Link href="/cont" title={user.email} className="hover:text-slate-800">
          Contul meu
        </Link>
        <Link href="/" className="hover:text-slate-800">
          Raportează
        </Link>
        <LogoutButton />
      </nav>
    </header>
  );
}
