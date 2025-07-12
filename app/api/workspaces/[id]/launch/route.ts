import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserOrganizationRole } from "@/lib/data/organization";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the workspace
    const workspace = await db.workspace.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        instances: {
          where: {
            status: {
              in: ['RUNNING', 'STARTING']
            }
          },
          select: {
            id: true,
            name: true,
            status: true,
            connectionUrl: true,
            startedAt: true
          }
        }
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if user has access to this workspace's organization
    const userRole = await getUserOrganizationRole(
      session.user.id, 
      workspace.project.organizationId
    );
    if (!userRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if there's already a running instance
    if (workspace.instances.length > 0) {
      const runningInstance = workspace.instances[0];
      return NextResponse.json({
        url: `/workspace?workspaceId=${workspace.id}`,
        instanceId: runningInstance.id,
        status: runningInstance.status,
        connectionUrl: runningInstance.connectionUrl,
        message: "Workspace is already running"
      });
    }

    // Create a new WebVM instance for the workspace
    const instance = await db.webVMInstance.create({
      data: {
        name: `${workspace.name}-instance-${Date.now()}`,
        workspaceId: workspace.id,
        status: 'STARTING',
        config: workspace.config || {},
        resources: {
          cpu: 2,
          memory: 4096,
          disk: 10240
        },
        networkConfig: {
          ports: [
            { local: 8080, remote: 8080, protocol: 'http' },
            { local: 3000, remote: 3000, protocol: 'http' },
            { local: 5000, remote: 5000, protocol: 'http' }
          ]
        }
      }
    });

    // Update workspace status to ACTIVE
    await db.workspace.update({
      where: { id: workspace.id },
      data: { status: 'ACTIVE' }
    });

    // In a real implementation, you would:
    // 1. Start the actual CheerpX container
    // 2. Wait for it to be ready
    // 3. Update the instance with the connection URL
    // 4. Set up networking and port forwarding
    
    // For now, we'll simulate the startup process
    setTimeout(async () => {
      try {
        await db.webVMInstance.update({
          where: { id: instance.id },
          data: {
            status: 'RUNNING',
            connectionUrl: `wss://webvm-${instance.id}.example.com`,
            startedAt: new Date()
          }
        });
      } catch (error) {
        console.error('Failed to update instance status:', error);
      }
    }, 2000);

    return NextResponse.json({
      url: `/workspace?workspaceId=${workspace.id}`,
      instanceId: instance.id,
      status: 'STARTING',
      message: "Workspace is starting up"
    }, { status: 201 });

  } catch (error) {
    console.error("Error launching workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    // Get workspace with running instances
    const workspace = await db.workspace.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            organizationId: true
          }
        },
        instances: {
          where: {
            status: {
              in: ['RUNNING', 'STARTING', 'STOPPING']
            }
          },
          select: {
            id: true,
            name: true,
            status: true,
            connectionUrl: true,
            startedAt: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check access
    const userRole = await getUserOrganizationRole(
      session.user.id, 
      workspace.project.organizationId
    );
    if (!userRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      workspaceId: workspace.id,
      status: workspace.status,
      instances: workspace.instances,
      isRunning: workspace.instances.some(instance => instance.status === 'RUNNING'),
      url: workspace.instances.length > 0 ? `/workspace?workspaceId=${workspace.id}` : null
    });

  } catch (error) {
    console.error("Error getting workspace launch status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    // Get workspace
    const workspace = await db.workspace.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            organizationId: true
          }
        },
        instances: {
          where: {
            status: {
              in: ['RUNNING', 'STARTING']
            }
          }
        }
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check access
    const userRole = await getUserOrganizationRole(
      session.user.id, 
      workspace.project.organizationId
    );
    if (!userRole || (userRole !== "OWNER" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Stop all running instances
    await db.webVMInstance.updateMany({
      where: {
        workspaceId: workspace.id,
        status: {
          in: ['RUNNING', 'STARTING']
        }
      },
      data: {
        status: 'STOPPING',
        stoppedAt: new Date()
      }
    });

    // Update workspace status
    await db.workspace.update({
      where: { id: workspace.id },
      data: { status: 'INACTIVE' }
    });

    // In a real implementation, you would:
    // 1. Send stop signals to the actual CheerpX containers
    // 2. Clean up resources
    // 3. Update final status to STOPPED

    // Simulate cleanup
    setTimeout(async () => {
      try {
        await db.webVMInstance.updateMany({
          where: {
            workspaceId: workspace.id,
            status: 'STOPPING'
          },
          data: {
            status: 'STOPPED',
            stoppedAt: new Date()
          }
        });
      } catch (error) {
        console.error('Failed to update stopped instances:', error);
      }
    }, 1000);

    return NextResponse.json({
      message: "Workspace stopped successfully"
    });

  } catch (error) {
    console.error("Error stopping workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
