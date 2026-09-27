import Link from "next/link";

const links = [
  { href: "/map", label: "Harta" },
  { href: "/", label: "Raportează o problemă" },
  { href: "/privacy", label: "Confidențialitate" },
  { href: "/login", label: "Pentru primărie" },
];

// The footer of the citizen pages, from the public_map mockup.
export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-outline-variant/60 bg-surface-container-low">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-8 sm:px-6 md:flex-row">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">Aici</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">See it. Report it. Fix it.</p>
          <span className="mt-1 font-label-md text-label-md text-on-surface-variant/80">
            Proiect universitar, Universitatea Tehnică a Moldovei
          </span>
        </div>
        <nav aria-label="Linkuri" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-on-surface"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
