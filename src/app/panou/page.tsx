import ReportsBoard from "@/components/ReportsBoard";
import StaffHeader from "@/components/auth/StaffHeader";
import { listReports } from "@/lib/reports";
import { requireStaffPage } from "@/lib/auth/dal";

export const dynamic = "force-dynamic";

export default async function Panou() {
  const { user } = await requireStaffPage("/panou");
  const reports = await listReports();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <StaffHeader user={user} subtitle="Panou primărie" />
      <ReportsBoard reports={reports} />
    </main>
  );
}
