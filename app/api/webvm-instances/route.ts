import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createWebVMInstanceSchema, webvmInstanceQuerySchema } from "@/lib/validations/workspace";
import { 
  createWebVMInstance, 
  getWebVMInstancesByOrganization,
  getWebVMInstancesByWorkspace 
} from "@/lib/data/webvm-instance";
import { getWorkspaceById } from "@/lib/data/workspace";
import { getUserOrganizationRole } from "@/lib/data/organization";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const workspaceId = searchParams.get("workspaceId");

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
      workspaceId: workspaceId || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      sortBy: searchParams.get("sortBy") || "updatedAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const validatedQuery = webvmInstanceQuerySchema.parse(queryParams);

    let instances;
    if (workspaceId) {
      // Get instances for a specific workspace
      instances = await getWebVMInstancesByWorkspace(workspaceId);
      return NextResponse.json(instances);
    } else {
      // Get instances for the organization with pagination
      instances = await getWebVMInstancesByOrganization(organizationId, validatedQuery);
      return NextResponse.json(instances);
    }
  } catch (error) {
    console.error("Error fetching WebVM instances:", error);
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
    const validatedData = createWebVMInstanceSchema.parse(body);

    // Get the workspace to check organization access
    const workspace = await getWorkspaceById(validatedData.workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if user has permission to create instances in this organization
    const userRole = await getUserOrganizationRole(
      session.user.id, 
      workspace.project.organizationId
    );
    if (!userRole || (userRole !== "OWNER" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const instance = await createWebVMInstance(validatedData);
    return NextResponse.json(instance, { status: 201 });
  } catch (error) {
    console.error("Error creating WebVM instance:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
