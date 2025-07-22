import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SEED_PROJECTS } from "@/components/pyodide/seed-projects/seed-project-templates";
import { ProjectTemplateCreator } from "@/components/dashboard/projects/project-template-creator";

interface TemplatePageProps {
  params: Promise<{
    templateId: string;
  }>;
  searchParams: Promise<{
    org?: string;
  }>;
}

export async function generateMetadata({ params }: TemplatePageProps): Promise<Metadata> {
  const { templateId } = await params;
  const template = SEED_PROJECTS.find(project => project.id === templateId);
  
  return {
    title: template ? `Create ${template.name} Project` : "Create Project from Template",
    description: template?.description || "Create a new project from a template",
  };
}

export default async function TemplatePage({ params, searchParams }: TemplatePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { templateId } = await params;
  const { org } = await searchParams;

  if (!org) {
    redirect("/dashboard");
  }

  // Find the template
  const template = SEED_PROJECTS.find(project => project.id === templateId);
  
  if (!template) {
    notFound();
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Create ${template.name} Project`}
        text={template.description}
      />
      
      <ProjectTemplateCreator 
        template={template}
        organizationId={org}
      />
    </DashboardShell>
  );
}
