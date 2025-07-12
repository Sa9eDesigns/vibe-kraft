import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserOrganizationRole } from "@/lib/data/organization";
import { getFirecrackerWorkspaceById } from "@/lib/data/workspace";
import { FirecrackerWorkspaceService } from "@/lib/services/firecracker-workspace";
import { z } from "zod";

const createContainerSchema = z.object({
  name: z.string().min(1).max(100),
  image: z.string().min(1),
  command: z.array(z.string()).optional(),
  args: z.array(z.string()).optional(),
  working_dir: z.string().optional(),
  environment: z.record(z.string()).optional(),
  ports: z.array(z.object({
    host_port: z.number().min(1).max(65535),
    container_port: z.number().min(1).max(65535),
    protocol: z.enum(['tcp', 'udp']).default('tcp'),
    host_ip: z.string().optional(),
  })).optional(),
  volumes: z.array(z.object({
    source: z.string(),
    target: z.string(),
    type: z.enum(['bind', 'volume', 'tmpfs']).default('bind'),
    read_only: z.boolean().optional(),
  })).optional(),
  labels: z.record(z.string()).optional(),
  restart_policy: z.enum(['no', 'always', 'unless-stopped', 'on-failure']).default('no'),
  resource_limits: z.object({
    cpu: z.string().optional(),
    memory: z.string().optional(),
    pids: z.number().optional(),
  }).optional(),
  security_opts: z.array(z.string()).optional(),
  capabilities: z.object({
    add: z.array(z.string()).optional(),
    drop: z.array(z.string()).optional(),
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

    if (!workspace.firecrackerVMs || workspace.firecrackerVMs.length === 0) {
      return NextResponse.json({ error: "No VM found for this workspace" }, { status: 404 });
    }

    const vm = workspace.firecrackerVMs[0];
    const containers = vm.containers || [];

    return NextResponse.json(containers);
  } catch (error) {
    console.error("Error fetching containers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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

    if (!workspace.firecrackerVMs || workspace.firecrackerVMs.length === 0) {
      return NextResponse.json({ error: "No VM found for this workspace" }, { status: 404 });
    }

    const vm = workspace.firecrackerVMs[0];
    if (vm.status !== 'RUNNING') {
      return NextResponse.json({ error: "VM must be running to create containers" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = createContainerSchema.parse(body);

    // Create container
    const container = await FirecrackerWorkspaceService.createContainer({
      vm_id: vm.id,
      config: validatedData,
    });

    return NextResponse.json(container, { status: 201 });
  } catch (error) {
    console.error("Error creating container:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
