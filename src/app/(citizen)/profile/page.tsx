import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentCitizen } from "@/features/citizens/session";
import { listReportsForCitizen } from "@/features/reports/queries";
import ProfileView from "@/features/citizens/profile/ProfileView";

export const metadata: Metadata = { title: "Contul meu" };

export default async function ProfilePage() {
  const citizen = await currentCitizen();
  if (!citizen) redirect("/sign-in?next=/profile");

  const reports = await listReportsForCitizen(citizen.id);
  // eslint-disable-next-line react-hooks/purity -- a server component renders once per request
  return <ProfileView email={citizen.email} reports={reports} now={Date.now()} />;
}
