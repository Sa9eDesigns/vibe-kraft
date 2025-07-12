import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserOrganizationRole } from "@/lib/data/organization";
import { getFirecrackerWorkspaces } from "@/lib/data/workspace";
import { FirecrackerWorkspaceService } from "@/lib/services/firecracker-workspace";
import { CreateFirecrackerWorkspaceRequest } from "@/lib/types/firecracker";
import { z } from "zod";

// Validation schemas
const createFirecrackerWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  project_id: z.string(),
  template_id: z.string().optional(),
  config: z.object({
    vm: z.object({
      vcpu_count: z.number().min(1).max(16).optional(),
      mem_size_mib: z.number().min(512).max(16384).optional(),
      kernel_image_path: z.string().optional(),
      boot_args: z.string().optional(),
    }).optional(),
    container_runtime: z.enum(['docker', 'containerd', 'podman']).optional(),
    environment: z.object({
      shell: z.string().optional(),
      editor: z.string().optional(),
      git_config: z.object({
        user_name: z.string().optional(),
        user_email: z.string().optional(),
      }).optional(),
      environment_variables: z.record(z.string()).optional(),
    }).optional(),
    features: z.object({
      ai_assistant: z.boolean().optional(),
      file_sync: z.boolean().optional(),
      port_forwarding: z.boolean().optional(),
      vnc_access: z.boolean().optional(),
      ssh_access: z.boolean().optional(),
    }).optional(),
    security: z.object({
      enable_seccomp: z.boolean().optional(),
      enable_apparmor: z.boolean().optional(),
      readonly_rootfs: z.boolean().optional(),
      user_namespace: z.boolean().optional(),
    }).optional(),
  }).optional(),
  resources: z.object({
    cpu: z.number().min(1).max(16).optional(),
    memory: z.number().min(512).max(16384).optional(),
    disk: z.number().min(10).max(500).optional(),
    network_bandwidth: z.number().optional(),
  }).optional(),
});

const querySchema = z.object({
  organizationId: z.string(),
  projectId: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED', 'ERROR']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = querySchema.parse(queryParams);
    const { organizationId, projectId, ...query } = validatedQuery;

    // Check user permissions
    const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    if (!userRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let workspaces;
    if (projectId) {
      // Get Firecracker workspaces for a specific project
      workspaces = await getFirecrackerWorkspaces(organizationId, { ...query, projectId });
    } else {
      // Get all Firecracker workspaces for the organization
      workspaces = await getFirecrackerWorkspaces(organizationId, query);
    }

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("Error fetching Firecracker workspaces:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query parameters", details: error.errors }, { status: 400 });
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
    const validatedData = createFirecrackerWorkspaceSchema.parse(body);

    // Extract organization ID from project
    const project = await db.project.findUnique({
      where: { id: validatedData.project_id },
      select: { organizationId: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check user permissions
    const userRole = await getUserOrganizationRole(session.user.id, project.organizationId);
    if (!userRole || (userRole !== "OWNER" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Create Firecracker workspace
    const result = await FirecrackerWorkspaceService.createWorkspace({
      name: validatedData.name,
      description: validatedData.description,
      project_id: validatedData.project_id,
      template_id: validatedData.template_id,
      config: validatedData.config,
      resources: validatedData.resources,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating Firecracker workspace:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
