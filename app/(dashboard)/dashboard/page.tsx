import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardTasks } from "@/components/dashboard/dashboard-tasks";
import { getUserOrganizations } from "@/lib/data/organization";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard overview of your account",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const organizations = await getUserOrganizations(session.user.id);
  const currentOrganization = organizations[0]; // Use first organization for now

  return (
    <div className="grid gap-6">
      <DashboardCards organizationId={currentOrganization?.id} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCharts
          className="lg:col-span-2"
          organizationId={currentOrganization?.id}
        />
        <DashboardTasks
          userId={session.user.id}
          organizationId={currentOrganization?.id}
        />
      </div>
    </div>
  );
}
