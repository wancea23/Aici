import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  CalendarCheck,
  ClipboardList,
  Compass,
  Eye,
  Flag,
  Lock,
  LogOut,
  Mail,
  Map,
  ShieldCheck,
  Sparkles,
  Wrench,
  type IconNode,
} from "lucide";
import Icon from "@/ui/Icon";
import LogoutButton from "@/ui/LogoutButton";
import type { BadgeId, CivicScore } from "@/features/citizens/civic-score";
import { accent, faint, muted, strong } from "@/features/citizens/profile/tones";

const badgeIcons: Record<BadgeId, IconNode> = {
  first: Flag,
  firstFix: Wrench,
  sharpEye: Eye,
  explorer: Compass,
  cleanCity: Sparkles,
  steady: CalendarCheck,
};

export function displayName(email: string) {
  return email.split("@")[0];
}

function initials(email: string) {
  const letters = displayName(email).replace(/[^\p{L}\p{N}]/gu, "");
  return (letters.slice(0, 2) || "?").toUpperCase();
}

// Avatar, level and the bar towards the next one. Also drawn at the top of the page on phones,
// where the sidebar is hidden.
export function ProfileCard({ email, score }: { email: string; score: CivicScore }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-4 shadow-sm dark:border-teal-700/40 dark:from-[#0f2e2a] dark:to-[#19212e]">
      <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-teal-100/50 dark:bg-teal-900/40" />
      <div className="relative z-10 flex items-start gap-3.5">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-base font-bold text-white shadow-sm">
            {initials(email)}
          </div>
          <span
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-[#19212e]"
            title="Email confirmat"
          >
            <Icon node={BadgeCheck} className="h-3 w-3" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className={`truncate text-sm font-bold ${strong}`}>{displayName(email)}</h2>
          <p className="font-mono text-[11px] font-medium text-teal-800 dark:text-teal-300">
            Nivel {score.level.level} · {score.level.title}
          </p>
          <div className={`mt-1 flex items-center gap-1 text-[11px] ${muted}`}>
            <Icon node={Mail} className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
            <span className="truncate">{email}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-teal-100/80 pt-3 dark:border-teal-700/40">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Scor civic:
          </span>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
            {score.points} pct (Nivel {score.level.level})
          </span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-teal-100 dark:bg-slate-700"
          role="progressbar"
          aria-label="Progres spre nivelul următor"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(score.progress * 100)}
        >
          <div className="h-full rounded-full bg-teal-600 dark:bg-teal-400" style={{ width: `${score.progress * 100}%` }} />
        </div>
        <p className={`mt-1 text-[10px] ${muted}`}>
          {score.next
            ? `Încă ${score.toNext} pct până la ${score.next.title}`
            : "Nivel maxim atins. Mulțumim!"}
        </p>
      </div>
    </div>
  );
}

export function BadgeShelf({ score }: { score: CivicScore }) {
  const earned = score.badges.filter((b) => b.earned).length;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs dark:border-slate-700/40 dark:bg-[#151d29]">
      <div className="mb-2.5 flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${faint}`}>Insignele tale</span>
        <span className={`font-mono text-[11px] font-medium ${accent}`}>
          {earned}/{score.badges.length}
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {score.badges.map((b) => (
          <li
            key={b.id}
            title={`${b.title}: ${b.hint}${b.earned ? "" : " (încă blocată)"}`}
            className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center ${
              b.earned
                ? "border-teal-200 bg-white text-teal-700 dark:border-teal-700/50 dark:bg-teal-900/40 dark:text-teal-300"
                : "border-dashed border-slate-200 text-slate-400 dark:border-slate-700/50 dark:text-slate-500"
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                b.earned ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-[#0e1a2b]" : "bg-slate-200/70 dark:bg-slate-700/60"
              }`}
            >
              <Icon node={b.earned ? badgeIcons[b.id] : Lock} className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-semibold leading-tight">{b.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
  return (
    <Link
      href={href}
      className={
        active
          ? "flex items-center justify-between rounded-lg border-l-4 border-teal-600 bg-teal-50 px-3 py-2.5 text-xs font-semibold text-teal-900 transition-colors dark:border-teal-400 dark:bg-teal-900/40 dark:text-teal-300"
          : "flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#222e40] dark:hover:text-slate-100"
      }
    >
      <div className="flex items-center gap-2.5">
        <Icon node={icon} className={`h-[18px] w-[18px] ${active ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`} />
        <span>{label}</span>
      </div>
      {children}
    </Link>
  );
}

export default function ProfileSidebar({
  email,
  score,
  total,
  unreadNotes,
}: {
  email: string;
  score: CivicScore;
  total: number;
  // messages from the city hall in the last week
  unreadNotes: boolean;
}) {
  return (
    // the outer column stretches to the page's height, the inner one stays in view while scrolling
    <div className="hidden w-72 shrink-0 border-r border-slate-200 bg-white dark:border-slate-700/50 dark:bg-[#19212e] lg:block">
    <aside className="sticky top-16 flex h-[calc(100vh-4rem)] select-none flex-col justify-between overflow-y-auto">
      <div className="space-y-6 p-5">
        <ProfileCard email={email} score={score} />

        <nav className="space-y-1">
          <span className={`mb-1 block px-3 text-[10px] font-bold uppercase tracking-wider ${faint}`}>Meniu principal</span>
          <NavLink href="#sesizari" icon={ClipboardList} label="Sesizările mele" active>
            <span className="rounded-full bg-teal-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-teal-500 dark:text-[#0e1a2b]">
              {total}
            </span>
          </NavLink>
          <NavLink href={total > 0 ? "#fisa" : "#sesizari"} icon={Bell} label="Mesaje de la primărie">
            {unreadNotes && (
              <span className="h-2 w-2 rounded-full bg-amber-500">
                <span className="sr-only">Ai mesaje noi</span>
              </span>
            )}
          </NavLink>
          <NavLink href="/map" icon={Map} label="Harta sesizărilor" />
          <NavLink href="/privacy" icon={ShieldCheck} label="Confidențialitate" />
        </nav>

        <BadgeShelf score={score} />
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-[#151d29]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Icon node={LogOut} className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <span className={`block text-[10px] font-bold uppercase tracking-wider ${faint}`}>Sesiune activă</span>
            <LogoutButton
              endpoint="/api/citizen/logout"
              to="/"
              className="block text-xs font-bold text-slate-800 hover:text-teal-600 dark:text-slate-200 dark:hover:text-teal-400"
            />
          </div>
        </div>
      </div>
    </aside>
    </div>
  );
}
