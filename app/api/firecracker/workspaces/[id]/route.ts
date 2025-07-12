import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserOrganizationRole } from "@/lib/data/organization";
import { getFirecrackerWorkspaceById } from "@/lib/data/workspace";
import { FirecrackerWorkspaceService } from "@/lib/services/firecracker-workspace";
import { z } from "zod";

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  config: z.object({
    vm: z.object({
      vcpu_count: z.number().min(1).max(16).optional(),
      mem_size_mib: z.number().min(512).max(16384).optional(),
    }).optional(),
    container_runtime: z.enum(['docker', 'containerd', 'podman']).optional(),
    environment: z.object({
      shell: z.string().optional(),
      editor: z.string().optional(),
      environment_variables: z.record(z.string()).optional(),
    }).optional(),
    features: z.object({
      ai_assistant: z.boolean().optional(),
      file_sync: z.boolean().optional(),
      port_forwarding: z.boolean().optional(),
      vnc_access: z.boolean().optional(),
      ssh_access: z.boolean().optional(),
    }).optional(),
  }).optional(),
  resources: z.object({
    cpu: z.number().min(1).max(16).optional(),
    memory: z.number().min(512).max(16384).optional(),
    disk: z.number().min(10).max(500).optional(),
  }).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await getFirecrackerWorkspaceById(params.id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check user permissions
    const userRole = await getUserOrganizationRole(session.user.id, workspace.project.organizationId);
    if (!userRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error fetching Firecracker workspace:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await getFirecrackerWorkspaceById(params.id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check user permissions
    const userRole = await getUserOrganizationRole(session.user.id, workspace.project.organizationId);
    if (!userRole || (userRole !== "OWNER" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateWorkspaceSchema.parse(body);

    // Update workspace
    const updatedWorkspace = await db.workspace.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        config: validatedData.config ? {
          ...workspace.config as any,
          ...validatedData.config
        } : workspace.config,
        updatedAt: new Date(),
      },
      include: {
        project: true,
        firecrackerVMs: {
          include: {
            containers: true,
            metrics: {
              orderBy: { timestamp: "desc" },
              take: 10,
            },
          },
        },
      },
    });

    // Update VM resources if provided
    if (validatedData.resources && workspace.firecrackerVMs.length > 0) {
      await db.firecrackerVM.update({
        where: { id: workspace.firecrackerVMs[0].id },
        data: {
          resources: {
            ...workspace.firecrackerVMs[0].resources as any,
            ...validatedData.resources
          },
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    console.error("Error updating Firecracker workspace:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await getFirecrackerWorkspaceById(params.id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check user permissions
    const userRole = await getUserOrganizationRole(session.user.id, workspace.project.organizationId);
    if (!userRole || (userRole !== "OWNER" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Stop all VMs before deletion
    for (const vm of workspace.firecrackerVMs) {
      if (vm.status === 'RUNNING') {
        await FirecrackerWorkspaceService.stopVM(vm.id);
      }
    }

    // Delete workspace (cascade will handle VMs and containers)
    await db.workspace.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.error("Error deleting Firecracker workspace:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
