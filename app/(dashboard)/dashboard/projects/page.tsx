import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProjectsList } from "@/components/dashboard/projects/projects-list";
import { CreateProjectDialog } from "@/components/dashboard/projects/create-project-dialog";
import { getUserOrganizations } from "@/lib/data/organization";

export const metadata: Metadata = {
  title: "Projects",
  description: "Manage your projects and tasks",
};

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const organizations = await getUserOrganizations(session.user.id);

  if (organizations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground">
            No organizations found
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Join an organization or create one to start managing projects.
          </p>
        </div>
      </div>
    );
  }

  // Use the first organization for now (in a real app, you'd have organization selection)
  const currentOrganization = organizations[0];

  return (
    <div className="space-y-6">
      <CreateProjectDialog organizationId={currentOrganization.id} />
      <ProjectsList organizationId={currentOrganization.id} />
    </div>
  );
}
