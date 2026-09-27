import Link from "next/link";
import { UserRound } from "lucide";
import AiciMark from "@/ui/AiciMark";
import HeaderNav from "@/ui/HeaderNav";
import Icon from "@/ui/Icon";
import ThemeToggle from "@/ui/ThemeToggle";
import { currentCitizen } from "@/features/citizens/session";

// The top bar of the citizen pages, from the Stitch mockups. wide: full width, for the profile
// with its sidebar; the other pages keep it centered.
export default async function SiteHeader({ wide = false }: { wide?: boolean }) {
  const citizen = await currentCitizen();
  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant/60 bg-surface/90 backdrop-blur-xl">
      <div className={`flex h-16 items-center justify-between gap-3 px-4 sm:px-6 ${wide ? "" : "mx-auto max-w-7xl"}`}>
        <Link href="/" className="flex min-w-0 items-center gap-2.5 text-primary">
          <AiciMark className="h-8 w-8 shrink-0" />
          <span className="flex flex-col">
            <span className="font-headline-sm text-headline-sm leading-none tracking-tight">Aici</span>
            <span className="hidden font-label-md text-label-md leading-tight text-on-surface-variant sm:inline">
              See it. Report it. Fix it.
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <HeaderNav />
          <ThemeToggle
            inline
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
          />
          {citizen ? (
            <Link
              href="/profile"
              title="Contul meu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary transition-opacity hover:opacity-90"
            >
              <Icon node={UserRound} className="h-[18px] w-[18px]" />
              <span className="sr-only">Contul meu</span>
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="flex h-9 items-center rounded-full border border-outline-variant px-4 font-label-lg text-label-lg text-primary transition-colors hover:bg-surface-container-low"
            >
              Conectare
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
