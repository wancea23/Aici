"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CirclePlus, Landmark, Map } from "lucide";
import Icon from "@/ui/Icon";

const links = [
  { href: "/", label: "Raportează o problemă", icon: CirclePlus },
  { href: "/map", label: "Harta", icon: Map },
  { href: "/login", label: "Pentru primărie", icon: Landmark },
];

// The page links in the site header. The open page gets the filled pill, like the mockup.
// On phones they shrink to icons. Below 1024px the city hall link is only in the footer.
export default function HeaderNav() {
  const path = usePathname();
  return (
    <nav aria-label="Pagini" className="flex items-center gap-1">
      {links.map(({ href, label, icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`${href === "/login" ? "hidden lg:flex" : "flex"} h-9 items-center gap-1.5 rounded-full px-3 font-label-lg text-label-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              active
                ? "bg-primary-container font-semibold text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
            }`}
          >
            <Icon node={icon} className="h-4 w-4 md:hidden" />
            <span className="hidden md:inline">{label}</span>
            <span className="sr-only md:hidden">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
