import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProjectDetails } from "@/components/dashboard/projects/project-details";
import { TasksList } from "@/components/dashboard/tasks/tasks-list";
import { CreateTaskDialog } from "@/components/dashboard/tasks/create-task-dialog";
import { getProjectById } from "@/lib/data/project";
import { getUserOrganizationRole } from "@/lib/data/organization";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  
  return {
    title: project?.name || "Project",
    description: project?.description || "Project details and tasks",
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const project = await getProjectById(id);
  
  if (!project) {
    notFound();
  }

  // Check if user has access to this project's organization
  const userRole = await getUserOrganizationRole(session.user.id, project.organizationId);
  
  if (!userRole) {
    redirect("/dashboard/projects");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={project.name}
        text={project.description || "Project details and tasks"}
      >
        <CreateTaskDialog projectId={project.id} />
      </DashboardHeader>
      
      <div className="grid gap-6">
        <ProjectDetails project={project} />
        <TasksList projectId={project.id} tasks={project.tasks} />
      </div>
    </DashboardShell>
  );
}