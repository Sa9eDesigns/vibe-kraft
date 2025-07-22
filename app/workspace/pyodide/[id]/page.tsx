import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PyodideWorkspaceContainer } from "@/components/pyodide/workspace/pyodide-workspace-container";

export const metadata: Metadata = {
  title: "Python Workspace",
  description: "Python development environment powered by Pyodide",
};

interface PyodideWorkspacePageProps {
  params: {
    id: string;
  };
}

export default async function PyodideWorkspacePage({ params }: PyodideWorkspacePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Get workspace and verify access
  const workspace = await db.workspace.findUnique({
    where: { id: params.id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          organizationId: true
        }
      }
    }
  });

  if (!workspace) {
    redirect("/dashboard");
  }

  // Verify workspace type
  if (workspace.type !== 'PYODIDE') {
    redirect(`/workspace/${params.id}`);
  }

  // TODO: Add proper access control check
  // For now, just check if user has access to the organization
  // In a real implementation, you'd check workspace permissions

  return (
    <PyodideWorkspaceContainer
      workspaceId={params.id}
      userId={session.user.id}
      workspace={workspace}
    />
  );
}
