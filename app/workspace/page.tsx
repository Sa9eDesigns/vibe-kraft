import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WorkspaceContainer } from "@/components/workspace/workspace-container";

export const metadata: Metadata = {
  title: "WebVM Workspace",
  description: "Full-screen development environment powered by CheerpX WebVM",
};

interface WorkspacePageProps {
  searchParams: Promise<{
    projectId?: string;
    workspaceId?: string;
  }>;
}

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const params = await searchParams;

  return (
    <WorkspaceContainer
      userId={session.user.id}
      projectId={params.projectId}
      workspaceId={params.workspaceId}
    />
  );
}
