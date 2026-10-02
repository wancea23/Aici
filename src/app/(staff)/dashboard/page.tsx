import ReportsBoard from "@/features/reports/ReportsBoard";
import StaffShell from "@/features/staff/StaffShell";
import { listReports } from "@/features/reports/queries";
import { requireStaffPage } from "@/features/staff/dal";

export const dynamic = "force-dynamic";

export default async function Panou() {
  const { user } = await requireStaffPage("/dashboard");
  const reports = await listReports();

  return (
    <StaffShell user={user} title="Panou primărie">
      <ReportsBoard reports={reports} />
    </StaffShell>
  );
}
