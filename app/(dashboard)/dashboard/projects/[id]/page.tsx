import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EnhancedProjectDetails } from "@/components/dashboard/projects/enhanced-project-details";
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
    <EnhancedProjectDetails project={{
      ...project,
      description: project.description || undefined,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      tasks: project.tasks.map(task => ({
        id: task.id,
        status: task.status as "TODO" | "IN_PROGRESS" | "DONE",
        priority: task.priority as "LOW" | "MEDIUM" | "HIGH",
        title: task.title,
        description: task.description || undefined,
      })),
      workspaces: project.workspaces.map(workspace => ({
        id: workspace.id,
        name: workspace.name,
        type: workspace.type as "WEBVM" | "FIRECRACKER" | "PYODIDE",
        status: workspace.status as "ACTIVE" | "INACTIVE" | "STARTING" | "STOPPING" | "ERROR",
        config: workspace.config as any,
        files: workspace.files?.map(file => ({
          id: file.id,
          name: file.name,
          path: file.path,
          type: file.type,
          size: Number(file.size),
        })) || [],
      })),
      organization: {
        id: project.organization.id,
        name: project.organization.name,
        slug: project.organization.slug,
      },
    }} />
  );
}