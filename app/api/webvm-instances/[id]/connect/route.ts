import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWebVMInstanceById } from "@/lib/data/webvm-instance";
import { getUserOrganizationRole } from "@/lib/data/organization";
import { sign } from "jsonwebtoken";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the instance to check permissions
    const instance = await getWebVMInstanceById(params.id);
    if (!instance) {
      return NextResponse.json({ error: "WebVM instance not found" }, { status: 404 });
    }

    // Check if user has permission to connect to this instance
    const userRole = await getUserOrganizationRole(
      session.user.id, 
      instance.workspace.project.organizationId
    );
    if (!userRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Generate WebSocket connection token
    const wsToken = sign(
      { 
        sub: session.user.id,
        instanceId: params.id,
        workspaceId: instance.workspaceId,
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
      },
      process.env.NEXTAUTH_SECRET!
    );

    // WebSocket connection URL
    const wsUrl = `${process.env.WEBSOCKET_URL || 'ws://localhost:8080'}?token=${wsToken}&instanceId=${params.id}`;

    return NextResponse.json({
      wsUrl,
      token: wsToken,
      instanceId: params.id,
      workspaceId: instance.workspaceId,
      connectionUrl: instance.connectionUrl,
      status: instance.status
    });
  } catch (error) {
    console.error("Error creating WebSocket connection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
