import Link from "next/link";
import AiciMark from "@/ui/AiciMark";
import LogoutButton from "@/ui/LogoutButton";
import ThemeToggle from "@/ui/ThemeToggle";
import StaffNav from "@/features/staff/StaffNav";
import { roleLabels } from "@/features/staff/accounts";
import { initials } from "@/ui/format";
import type { StaffUser } from "@/features/staff/session";

// Frame of every signed in staff page, from the staff_dashboard mockup: sidebar on wide
// screens, a top bar with the menu as pills on phones.
export default function StaffShell({
  user,
  title,
  children,
}: {
  user: StaffUser;
  title: string;
  children: React.ReactNode;
}) {
  const admin = user.role === "admin";
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-outline-variant/60 bg-surface-container-low lg:flex">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-5 pb-6 pt-5 text-primary">
          <AiciMark className="h-9 w-9 shrink-0" />
          <span className="flex flex-col">
            <span className="flex items-center gap-2">
              <span className="font-headline-sm text-headline-sm leading-none">Aici</span>
              <span className="rounded bg-secondary-container px-1.5 py-0.5 font-label-md text-label-md text-on-secondary-fixed">
                Primărie
              </span>
            </span>
            <span className="mt-1 font-label-md text-label-md text-on-surface-variant">Portal pentru angajați</span>
          </span>
        </Link>

        <div className="flex-1 px-3">
          <StaffNav admin={admin} />
        </div>

        <div className="border-t border-outline-variant/60 p-4">
          <p className="truncate font-label-lg text-label-lg text-on-surface" title={user.email}>
            {user.email}
          </p>
          <p className="font-label-md text-label-md text-on-surface-variant">{roleLabels[user.role]}</p>
          <LogoutButton withIcon className="mt-3 flex items-center gap-2 font-label-lg text-label-lg text-error hover:underline" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-outline-variant/60 bg-surface/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <Link href="/dashboard" className="text-primary lg:hidden" aria-label="Aici, panou">
                <AiciMark className="h-8 w-8" />
              </Link>
              <h1 className="truncate font-headline-sm text-headline-sm text-on-surface">{title}</h1>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle
                inline
                className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
              />
              <Link
                href="/account"
                title={`${user.email} · ${roleLabels[user.role]}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-label-lg text-label-lg text-on-primary transition-opacity hover:opacity-90"
              >
                {initials(user.email)}
                <span className="sr-only">Contul meu</span>
              </Link>
              <LogoutButton
                withIcon
                className="ml-1 flex h-9 items-center gap-1.5 rounded-full px-3 font-label-lg text-label-lg text-error transition-colors hover:bg-error/10 lg:hidden"
              />
            </div>
          </div>
          <div className="px-4 pb-2 lg:hidden">
            <StaffNav admin={admin} row />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
