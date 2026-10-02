"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CirclePlus, LayoutDashboard, ShieldCheck, UserRoundCog } from "lucide";
import Icon from "@/ui/Icon";

const links = [
  { href: "/dashboard", label: "Panou", icon: LayoutDashboard },
  { href: "/admin", label: "Administrare", icon: ShieldCheck, adminOnly: true },
  { href: "/account", label: "Contul meu", icon: UserRoundCog },
  { href: "/", label: "Raportează", icon: CirclePlus },
];

// Staff menu. A column in the sidebar, a row of pills on phones. The open page is filled.
export default function StaffNav({ admin, row = false }: { admin: boolean; row?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Meniu primărie" className={row ? "flex gap-1 overflow-x-auto" : "flex flex-col gap-1"}>
      {links
        .filter((l) => admin || !l.adminOnly)
        .map(({ href, label, icon }) => {
          const active = href !== "/" && (path === href || path.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 font-label-lg text-label-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                row ? "h-9 rounded-full px-3" : "h-11 rounded-xl px-3.5"
              } ${
                active
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon node={icon} className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
    </nav>
  );
}
