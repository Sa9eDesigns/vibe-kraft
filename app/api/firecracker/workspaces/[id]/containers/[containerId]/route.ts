import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserOrganizationRole } from "@/lib/data/organization";
import { getFirecrackerWorkspaceById } from "@/lib/data/workspace";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; containerId: string } }
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

    const container = await db.firecrackerContainer.findUnique({
      where: { id: params.containerId },
      include: {
        logs: {
          orderBy: { timestamp: "desc" },
          take: 100,
        },
        vm: true,
      },
    });

    if (!container) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    return NextResponse.json(container);
  } catch (error) {
    console.error("Error fetching container:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; containerId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();

    if (!['start', 'stop', 'restart', 'pause', 'unpause', 'remove'].includes(action)) {
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

    const container = await db.firecrackerContainer.findUnique({
      where: { id: params.containerId },
      include: { vm: true },
    });

    if (!container) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    let result;
    switch (action) {
      case 'start':
        if (container.status === 'RUNNING') {
          return NextResponse.json({ error: "Container is already running" }, { status: 400 });
        }
        await db.firecrackerContainer.update({
          where: { id: params.containerId },
          data: { 
            status: 'RUNNING',
            startedAt: new Date(),
          }
        });
        result = { message: "Container started successfully" };
        break;
      
      case 'stop':
        if (container.status === 'STOPPED') {
          return NextResponse.json({ error: "Container is already stopped" }, { status: 400 });
        }
        await db.firecrackerContainer.update({
          where: { id: params.containerId },
          data: { 
            status: 'STOPPED',
            stoppedAt: new Date(),
          }
        });
        result = { message: "Container stopped successfully" };
        break;
      
      case 'restart':
        await db.firecrackerContainer.update({
          where: { id: params.containerId },
          data: { 
            status: 'RUNNING',
            startedAt: new Date(),
          }
        });
        result = { message: "Container restarted successfully" };
        break;
      
      case 'pause':
        if (container.status !== 'RUNNING') {
          return NextResponse.json({ error: "Container must be running to pause" }, { status: 400 });
        }
        await db.firecrackerContainer.update({
          where: { id: params.containerId },
          data: { status: 'PAUSED' }
        });
        result = { message: "Container paused successfully" };
        break;
      
      case 'unpause':
        if (container.status !== 'PAUSED') {
          return NextResponse.json({ error: "Container must be paused to unpause" }, { status: 400 });
        }
        await db.firecrackerContainer.update({
          where: { id: params.containerId },
          data: { status: 'RUNNING' }
        });
        result = { message: "Container unpaused successfully" };
        break;
      
      case 'remove':
        if (container.status === 'RUNNING') {
          return NextResponse.json({ error: "Stop container before removing" }, { status: 400 });
        }
        await db.firecrackerContainer.delete({
          where: { id: params.containerId }
        });
        result = { message: "Container removed successfully" };
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error performing container action:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; containerId: string } }
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

    const container = await db.firecrackerContainer.findUnique({
      where: { id: params.containerId },
    });

    if (!container) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    if (container.status === 'RUNNING') {
      return NextResponse.json({ error: "Stop container before deleting" }, { status: 400 });
    }

    await db.firecrackerContainer.delete({
      where: { id: params.containerId }
    });

    return NextResponse.json({ message: "Container deleted successfully" });
  } catch (error) {
    console.error("Error deleting container:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
