import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { bulkUpdateWorkspacesSchema } from "@/lib/validations/workspace";
import { bulkUpdateWorkspaces, getWorkspaceById } from "@/lib/data/workspace";
import { getUserOrganizationRole } from "@/lib/data/organization";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkUpdateWorkspacesSchema.parse(body);

    // Check permissions for all workspaces
    const workspaceChecks = await Promise.all(
      validatedData.workspaceIds.map(async (id) => {
        const workspace = await getWorkspaceById(id);
        if (!workspace) {
          throw new Error(`Workspace ${id} not found`);
        }
        
        const userRole = await getUserOrganizationRole(
          session.user.id, 
          workspace.project.organizationId
        );
        
        if (!userRole || (userRole !== "OWNER" && userRole !== "ADMIN")) {
          throw new Error(`Insufficient permissions for workspace ${id}`);
        }
        
        return workspace;
      })
    );

    const result = await bulkUpdateWorkspaces(validatedData);
    return NextResponse.json({
      message: `Successfully updated ${result.count} workspaces`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error bulk updating workspaces:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("permissions")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
