import {
  BadgeCheck,
  CalendarCheck,
  Compass,
  Eye,
  Flag,
  Lock,
  LogOut,
  Mail,
  Sparkles,
  Wrench,
  type IconNode,
} from "lucide";
import Icon from "@/ui/Icon";
import LogoutButton from "@/ui/LogoutButton";
import ProfileNav from "@/features/citizens/profile/ProfileNav";
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

// Avatar, level and the bar towards the next one: the only place the score is shown.
// compact: the phone version at the top of the page, without the email line.
export function ProfileCard({ email, score, compact = false }: { email: string; score: CivicScore; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white shadow-sm dark:border-teal-700/40 dark:from-[#0f2e2a] dark:to-[#19212e] ${compact ? "p-3.5" : "p-4"}`}>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className={`flex items-center justify-center rounded-full bg-teal-600 font-bold text-white ${compact ? "h-10 w-10 text-sm" : "h-12 w-12 text-base"}`}>
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
          {!compact && (
            <div className={`mt-0.5 flex items-center gap-1 text-[11px] ${muted}`}>
              <Icon node={Mail} className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{email}</span>
            </div>
          )}
          {compact && <ScoreLine score={score} />}
        </div>
      </div>

      {compact ? (
        <ScoreBar score={score} className="mt-3" />
      ) : (
        <div className="mt-4 border-t border-teal-100/80 pt-3 dark:border-teal-700/40">
          <ScoreLine score={score} />
          <ScoreBar score={score} className="mt-1.5" />
        </div>
      )}
    </div>
  );
}

function ScoreLine({ score }: { score: CivicScore }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span className="truncate font-semibold text-teal-800 dark:text-teal-300">
        Nivel {score.level.level} · {score.level.title}
      </span>
      <span className="shrink-0 font-mono text-[11px] font-bold text-teal-700 dark:text-teal-400">{score.points} pct</span>
    </div>
  );
}

function ScoreBar({ score, className }: { score: CivicScore; className?: string }) {
  return (
    <div className={className}>
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
      <p className={`mt-1 text-[11px] ${muted}`}>
        {score.next ? `Încă ${score.toNext} pct până la ${score.next.title}` : "Nivel maxim atins. Mulțumim!"}
      </p>
    </div>
  );
}

// Earned badges in color, locked ones faded. The hint says how to earn each one.
export function BadgeShelf({ score }: { score: CivicScore }) {
  const earned = score.badges.filter((b) => b.earned).length;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs dark:border-slate-700/40 dark:bg-[#19212e]">
      <div className="mb-3 flex items-center justify-between">
        <span className={`text-[11px] font-bold uppercase tracking-wider ${faint}`}>Insigne</span>
        <span className={`font-mono text-[11px] font-medium ${accent}`}>
          {earned}/{score.badges.length}
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-6 lg:grid-cols-3">
        {score.badges.map((b) => (
          <li
            key={b.id}
            title={`${b.title}: ${b.hint}${b.earned ? "" : " (încă blocată)"}`}
            className={`flex flex-col items-center gap-1 text-center ${b.earned ? "text-teal-800 dark:text-teal-300" : "text-slate-400 dark:text-slate-500"}`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                b.earned ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-[#0e1a2b]" : "bg-slate-100 dark:bg-slate-700/60"
              }`}
            >
              <Icon node={b.earned ? badgeIcons[b.id] : Lock} className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-semibold leading-tight">{b.title}</span>
            <span className="sr-only">{b.earned ? "câștigată" : `blocată, ${b.hint}`}</span>
          </li>
        ))}
      </ul>
    </div>
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
    <aside className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col justify-between overflow-y-auto">
      <div className="space-y-6 p-5">
        <ProfileCard email={email} score={score} />

        <ProfileNav total={total} unreadNotes={unreadNotes} />

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
