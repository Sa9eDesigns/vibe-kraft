import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserOrganizationRole } from "@/lib/data/organization";
import { getFirecrackerWorkspaceById } from "@/lib/data/workspace";
import { FirecrackerWorkspaceService } from "@/lib/services/firecracker-workspace";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();

    if (!['start', 'stop', 'restart', 'pause', 'resume'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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

    let result;
    switch (action) {
      case 'start':
        if (vm.status === 'RUNNING') {
          return NextResponse.json({ error: "VM is already running" }, { status: 400 });
        }
        result = await FirecrackerWorkspaceService.startVM(vm.id);
        break;
      
      case 'stop':
        if (vm.status === 'STOPPED') {
          return NextResponse.json({ error: "VM is already stopped" }, { status: 400 });
        }
        await FirecrackerWorkspaceService.stopVM(vm.id);
        result = { message: "VM stopped successfully" };
        break;
      
      case 'restart':
        if (vm.status === 'RUNNING') {
          await FirecrackerWorkspaceService.stopVM(vm.id);
        }
        result = await FirecrackerWorkspaceService.startVM(vm.id);
        break;
      
      case 'pause':
        if (vm.status !== 'RUNNING') {
          return NextResponse.json({ error: "VM must be running to pause" }, { status: 400 });
        }
        await db.firecrackerVM.update({
          where: { id: vm.id },
          data: { status: 'PAUSED' }
        });
        result = { message: "VM paused successfully" };
        break;
      
      case 'resume':
        if (vm.status !== 'PAUSED') {
          return NextResponse.json({ error: "VM must be paused to resume" }, { status: 400 });
        }
        await db.firecrackerVM.update({
          where: { id: vm.id },
          data: { status: 'RUNNING' }
        });
        result = { message: "VM resumed successfully" };
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error performing VM action:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    // Get VM metrics
    const metrics = await FirecrackerWorkspaceService.getVMMetrics(vm.id, 24);

    return NextResponse.json({
      vm: {
        id: vm.id,
        name: vm.name,
        status: vm.status,
        vmId: vm.vmId,
        config: vm.config,
        resources: vm.resources,
        socketPath: vm.socketPath,
        logPath: vm.logPath,
        metricsPath: vm.metricsPath,
        createdAt: vm.createdAt,
        updatedAt: vm.updatedAt,
        startedAt: vm.startedAt,
        stoppedAt: vm.stoppedAt,
      },
      containers: vm.containers,
      metrics: metrics,
      snapshots: vm.snapshots,
    });
  } catch (error) {
    console.error("Error fetching VM details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
