import ReportsBoard from "@/features/reports/ReportsBoard";
import StaffHeader from "@/features/staff/StaffHeader";
import { listReports } from "@/features/reports/queries";
import { requireStaffPage } from "@/features/staff/dal";

export const dynamic = "force-dynamic";

export default async function Panou() {
  const { user } = await requireStaffPage("/dashboard");
  const reports = await listReports();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <StaffHeader user={user} subtitle="Panou primărie" />
      <ReportsBoard reports={reports} />
    </main>
  );
}
