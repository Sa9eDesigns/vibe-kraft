import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getWebVMInstanceById,
  startWebVMInstance,
  stopWebVMInstance,
  restartWebVMInstance
} from "@/lib/data/webvm-instance";
import { getUserOrganizationRole } from "@/lib/data/organization";
import { getContainerManager } from "@/lib/webvm/container-manager";
import { z } from "zod";

const controlActionSchema = z.object({
  action: z.enum(["start", "stop", "restart"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First get the instance to check permissions
    const existingInstance = await getWebVMInstanceById(params.id);
    if (!existingInstance) {
      return NextResponse.json({ error: "WebVM instance not found" }, { status: 404 });
    }

    // Check if user has permission to control this instance
    const userRole = await getUserOrganizationRole(
      session.user.id, 
      existingInstance.workspace.project.organizationId
    );
    if (!userRole || (userRole !== "OWNER" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = controlActionSchema.parse(body);

    const containerManager = getContainerManager();
    let instance;

    switch (action) {
      case "start":
        if (existingInstance.status === "RUNNING") {
          return NextResponse.json({ error: "Instance is already running" }, { status: 400 });
        }

        // Start container through container manager
        try {
          await containerManager.getContainer(params.id, session.user.id);
          instance = await startWebVMInstance(params.id);
        } catch (error) {
          return NextResponse.json({
            error: `Failed to start container: ${error}`
          }, { status: 500 });
        }
        break;

      case "stop":
        if (existingInstance.status === "STOPPED") {
          return NextResponse.json({ error: "Instance is already stopped" }, { status: 400 });
        }

        // Stop container through container manager
        const container = containerManager.getContainerByInstanceId(params.id);
        if (container) {
          await containerManager.stopContainer(container.id);
        }
        instance = await stopWebVMInstance(params.id);
        break;

      case "restart":
        // Stop then start
        const existingContainer = containerManager.getContainerByInstanceId(params.id);
        if (existingContainer) {
          await containerManager.stopContainer(existingContainer.id);
        }
        await containerManager.getContainer(params.id, session.user.id);
        instance = await restartWebVMInstance(params.id);
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      message: `Instance ${action} initiated successfully`,
      instance,
    });
  } catch (error) {
    console.error(`Error ${action} WebVM instance:`, error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
