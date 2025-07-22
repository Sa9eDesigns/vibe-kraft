import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardTasks } from "@/components/dashboard/dashboard-tasks";
import { getUserOrganizations } from "@/lib/data/organization";
import { db } from "@/lib/db";

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

  // Prioritize organization with Pyodide projects (for showcasing seeded projects)
  let currentOrganization = organizations[0]; // Default to first

  // Check if any organization has Pyodide projects and prioritize it
  for (const org of organizations) {
    const projects = await db.project.findMany({
      where: { organizationId: org.id },
      include: {
        workspaces: {
          where: { type: 'PYODIDE' },
          select: { id: true }
        }
      },
      take: 1 // Just check if any exist
    });

    if (projects.some(p => p.workspaces.length > 0)) {
      currentOrganization = org;
      break; // Use the first org with Pyodide projects
    }
  }

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
