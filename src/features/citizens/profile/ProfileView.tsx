import Link from "next/link";
import { Inter } from "next/font/google";
import { Archive, CirclePlus, Clock, Landmark, SlidersHorizontal } from "lucide";
import Icon from "@/ui/Icon";
import ThemeToggle from "@/ui/ThemeToggle";
import LogoutButton from "@/ui/LogoutButton";
import AccountData from "@/features/citizens/AccountData";
import { civicScore } from "@/features/citizens/civic-score";
import type { CitizenReport } from "@/features/reports/queries";
import ProfileHub from "@/features/citizens/profile/ProfileHub";
import ProfileSidebar, { BadgeShelf, ProfileCard } from "@/features/citizens/profile/ProfileSidebar";
import { body, ghostButton, muted, pageBg, panel, strong, tealButton } from "@/features/citizens/profile/tones";
import { formatDate, howMany } from "@/ui/format";

// The Command Hub mockup is set in Inter, the rest of the app in Plus Jakarta Sans.
const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap" });

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function Stat({
  label,
  value,
  caption,
  tag,
  tone,
}: {
  label: string;
  value: number;
  caption: string;
  tag?: React.ReactNode;
  tone: "slate" | "amber" | "teal";
}) {
  const box = {
    slate: "bg-slate-50/70 border-slate-200/80 dark:bg-[#151d29] dark:border-slate-700/50",
    amber: "bg-amber-50/40 border-amber-200/80 dark:bg-amber-900/20 dark:border-amber-700/50",
    teal: "bg-teal-50/40 border-teal-200/80 dark:bg-teal-900/20 dark:border-teal-700/40",
  }[tone];
  const labelColor = { slate: muted, amber: "text-amber-800 dark:text-amber-400", teal: "text-teal-800 dark:text-teal-400" }[tone];
  const valueColor = { slate: strong, amber: "text-amber-700 dark:text-amber-400", teal: "text-teal-600 dark:text-teal-400" }[tone];
  return (
    <div className={`flex flex-col justify-between rounded-xl border p-4 ${box}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className={`text-[11px] font-bold uppercase tracking-wider ${labelColor}`}>{label}</span>
        {tag}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`font-mono text-2xl font-bold ${valueColor}`}>{value}</span>
        <span className={`text-xs ${muted}`}>{caption}</span>
      </div>
    </div>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${className}`}>{children}</span>;
}

// The citizen's profile laid out like the Command Hub mockup. Gets everything as props, so the
// page only loads the data.
export default function ProfileView({ email, reports, now }: { email: string; reports: CitizenReport[]; now: number }) {
  const score = civicScore(reports);
  const count = (s: string) => reports.filter((r) => r.status === s).length;

  // the newest thing that happened to any of the citizen's reports
  const lastUpdate = reports
    .flatMap((r) => [r.created_at, ...r.events.map((e) => e.at)])
    .sort()
    .at(-1);
  const unreadNotes = reports.some((r) => r.events.some((e) => e.note && now - new Date(e.at).getTime() < WEEK_MS));

  return (
    <div className={`${inter.className} flex min-h-screen flex-col antialiased ${pageBg} text-slate-800 dark:text-slate-200`}>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-700/50 dark:bg-[#19212e] sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
              <Icon node={Landmark} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xs font-semibold uppercase leading-tight tracking-wider text-teal-700 dark:text-teal-400">
                Aici · Sesizări civice Chișinău
              </span>
              <h1 className={`truncate text-sm font-bold leading-none tracking-tight ${strong}`}>
                Portalul Cetățeanului — Cabinet Personal
              </h1>
            </div>
          </Link>
          <div className="hidden items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-700/50 xl:flex">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Nivel {score.level.level} · {score.level.title}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {lastUpdate && (
            <div className="hidden items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-600 dark:border-slate-700/50 dark:bg-[#151d29] dark:text-slate-300 lg:flex">
              <Icon node={Clock} className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span suppressHydrationWarning>Actualizat: {formatDate(lastUpdate).replace(/\.\d{4},?/, ",")}</span>
            </div>
          )}
          <ThemeToggle
            inline
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${ghostButton}`}
          />
          <a
            href="#setari"
            className={`hidden items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors md:flex ${ghostButton}`}
          >
            <Icon node={SlidersHorizontal} className="h-4 w-4" />
            <span>Setări cont</span>
          </a>
          <Link
            href="/"
            aria-label="Raportează o problemă nouă"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all md:px-4 ${tealButton}`}
          >
            <Icon node={CirclePlus} className="h-[18px] w-[18px]" />
            <span className="hidden whitespace-nowrap md:inline">Raportează o problemă nouă</span>
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        <ProfileSidebar email={email} score={score} total={reports.length} unreadNotes={unreadNotes} />

        <main className={`flex min-w-0 flex-1 flex-col ${pageBg}`}>
          <section className="border-b border-slate-200 bg-white px-4 py-5 dark:border-slate-700/50 dark:bg-[#19212e] sm:px-8">
            <div className="mx-auto max-w-[1600px] space-y-4">
              {/* the sidebar is hidden on phones, so its profile card and badges come up here */}
              <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                <ProfileCard email={email} score={score} />
                <BadgeShelf score={score} />
              </div>
              <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                <Stat
                  label="Total sesizări"
                  value={reports.length}
                  caption="trimise de tine"
                  tone="slate"
                  tag={<Icon node={Archive} className="h-5 w-5 text-slate-400" />}
                />
                <Stat
                  label="În curs de execuție"
                  value={count("in_lucru")}
                  caption="în lucru la primărie"
                  tone="amber"
                  tag={
                    <Tag className="border border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/40 dark:text-amber-300">
                      Activ
                    </Tag>
                  }
                />
                <Stat
                  label="Finalizate cu succes"
                  value={count("rezolvat")}
                  caption={count("rezolvat") === 1 ? "problemă rezolvată" : "probleme rezolvate"}
                  tone="teal"
                  tag={
                    <Tag className="border border-teal-200 bg-teal-100 text-teal-900 dark:border-teal-700/50 dark:bg-teal-900/50 dark:text-teal-300">
                      Rezolvat
                    </Tag>
                  }
                />
                <Stat
                  label="În așteptare"
                  value={count("nou")}
                  caption="verificare în derulare"
                  tone="slate"
                  tag={<Tag className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">Triaj</Tag>}
                />
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-3 sm:space-y-8 sm:p-6 lg:p-8">
            <ProfileHub reports={reports} score={score} now={now} unreadNotes={unreadNotes} />

            <div id="setari" className={`scroll-mt-20 rounded-xl border p-4 shadow-sm sm:p-5 xl:w-[calc((100%-2rem)*7/12)] ${panel}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className={`text-base font-bold tracking-tight ${strong}`}>Setări cont</h3>
                  <p className={`text-xs ${body}`}>
                    {email} · {howMany(score.badges.filter((b) => b.earned).length, "insigne")} câștigate
                  </p>
                </div>
                <LogoutButton
                  endpoint="/api/citizen/logout"
                  to="/"
                  className={`h-8 rounded-lg px-3 text-xs font-semibold transition-colors ${ghostButton}`}
                />
              </div>
              <AccountData />
              {/* the sidebar with these links is hidden below 1024px */}
              <nav aria-label="Alte pagini" className={`mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs font-semibold dark:border-slate-700/50 lg:hidden`}>
                <Link href="/map" className="text-teal-700 hover:underline dark:text-teal-400">
                  Harta sesizărilor
                </Link>
                <Link href="/privacy" className="text-teal-700 hover:underline dark:text-teal-400">
                  Confidențialitate
                </Link>
              </nav>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
