import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createWorkspaceSchema, workspaceQuerySchema } from "@/lib/validations/workspace";
import { 
  createWorkspace, 
  getWorkspacesByOrganization,
  getWorkspacesByProject 
} from "@/lib/data/workspace";
import { getUserOrganizationRole } from "@/lib/data/organization";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const projectId = searchParams.get("projectId");

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Check if user is a member of the organization
    const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    if (!userRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Parse query parameters
    const queryParams = {
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      sortBy: searchParams.get("sortBy") || "updatedAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const validatedQuery = workspaceQuerySchema.parse(queryParams);

    let workspaces;
    if (projectId) {
      // Get workspaces for a specific project
      workspaces = await getWorkspacesByProject(projectId);
      return NextResponse.json(workspaces);
    } else {
      // Get workspaces for the organization with pagination
      workspaces = await getWorkspacesByOrganization(organizationId, validatedQuery);
      return NextResponse.json(workspaces);
    }
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createWorkspaceSchema.parse(body);

    // Get the project to check organization access
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Check if user has permission to create workspaces in this organization
    const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    if (!userRole || (userRole !== "OWNER" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const workspace = await createWorkspace(validatedData);
    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error("Error creating workspace:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
