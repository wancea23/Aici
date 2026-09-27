import LogoutButton from "@/ui/LogoutButton";
import SiteHeader from "@/ui/SiteHeader";
import SiteFooter from "@/ui/SiteFooter";
import AccountData from "@/features/citizens/AccountData";
import { civicScore } from "@/features/citizens/civic-score";
import type { CitizenReport } from "@/features/reports/queries";
import ProfileHub from "@/features/citizens/profile/ProfileHub";
import ProfileSidebar, { BadgeShelf, ProfileCard } from "@/features/citizens/profile/ProfileSidebar";
import { body, ghostButton, pageBg, panel, strong } from "@/features/citizens/profile/tones";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// The citizen's profile, from the Command Hub mockup but with every repeated piece cut: the
// level lives only in the profile card, the counts only in the status chips. Gets everything
// as props, so the page only loads the data.
export default function ProfileView({ email, reports, now }: { email: string; reports: CitizenReport[]; now: number }) {
  const score = civicScore(reports);
  const unreadNotes = reports.some((r) => r.events.some((e) => e.note && now - new Date(e.at).getTime() < WEEK_MS));

  return (
    <div className={`flex min-h-screen flex-col ${pageBg} text-slate-800 dark:text-slate-200`}>
      <SiteHeader wide />

      <div className="flex flex-1">
        <ProfileSidebar email={email} score={score} total={reports.length} unreadNotes={unreadNotes} />

        <main className="mx-auto flex w-full min-w-0 max-w-[1400px] flex-1 flex-col gap-6 p-3 sm:p-6 lg:p-8">
          {/* the sidebar is hidden on phones, so a small profile card comes first here */}
          <div className="lg:hidden">
            <ProfileCard email={email} score={score} compact />
          </div>

          <ProfileHub reports={reports} now={now} unreadNotes={unreadNotes} />

          <div className="lg:hidden">
            <BadgeShelf score={score} />
          </div>

          <section id="setari" className={`scroll-mt-20 rounded-xl border p-4 shadow-sm sm:p-5 xl:w-[calc((100%-2rem)*7/12)] ${panel}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className={`text-base font-bold tracking-tight ${strong}`}>Setări cont</h2>
                <p className={`text-xs ${body}`}>{email}</p>
              </div>
              <LogoutButton
                endpoint="/api/citizen/logout"
                to="/"
                className={`h-8 rounded-lg px-3 text-xs font-semibold transition-colors ${ghostButton}`}
              />
            </div>
            <AccountData />
          </section>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
