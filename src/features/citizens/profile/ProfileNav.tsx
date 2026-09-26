"use client";

import Link from "next/link";
import { Bell, ClipboardList, Map, ShieldCheck, type IconNode } from "lucide";
import Icon from "@/ui/Icon";
import { faint } from "@/features/citizens/profile/tones";
import useSection from "@/features/citizens/profile/useHash";

function NavLink({
  href,
  icon,
  label,
  active = false,
  children,
}: {
  href: string;
  icon: IconNode;
  label: string;
  active?: boolean;
  children?: React.ReactNode;
}) {
  // A section of this page is a plain anchor: next/link changes the hash with pushState, which
  // fires no hashchange, so useHash would never see it.
  const Tag = href.startsWith("#") ? "a" : Link;
  return (
    <Tag
      href={href}
      aria-current={active ? "location" : undefined}
      className={
        active
          ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-teal-400 dark:focus-visible:ring-offset-[#19212e] flex items-center justify-between rounded-lg border-l-4 border-teal-600 bg-teal-50 px-3 py-2.5 text-xs font-semibold text-teal-900 transition-colors dark:border-teal-400 dark:bg-teal-900/40 dark:text-teal-300"
          : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-teal-400 dark:focus-visible:ring-offset-[#19212e] flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#222e40] dark:hover:text-slate-100"
      }
    >
      <div className="flex items-center gap-2.5">
        <Icon node={icon} className={`h-[18px] w-[18px] ${active ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`} />
        <span>{label}</span>
      </div>
      {children}
    </Tag>
  );
}

// Which item is green follows the section open in the URL hash, see useHash.
export default function ProfileNav({ total, unreadNotes }: { total: number; unreadNotes: boolean }) {
  const section = useSection();
  return (
    <nav className="space-y-1" aria-label="Meniu principal">
      <span className={`mb-1 block px-3 text-[10px] font-bold uppercase tracking-wider ${faint}`}>Meniu principal</span>
      <NavLink href="#sesizari" icon={ClipboardList} label="Sesizările mele" active={section === "reports"}>
        <span className="rounded-full bg-teal-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-teal-500 dark:text-[#0e1a2b]">
          {total}
        </span>
      </NavLink>
      <NavLink href="#mesaje" icon={Bell} label="Mesaje de la primărie" active={section === "messages"}>
        {unreadNotes && (
          <span className="h-2 w-2 rounded-full bg-amber-500">
            <span className="sr-only">Ai mesaje noi</span>
          </span>
        )}
      </NavLink>
      <NavLink href="/map" icon={Map} label="Harta sesizărilor" />
      <NavLink href="/privacy" icon={ShieldCheck} label="Confidențialitate" />
    </nav>
  );
}
