import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateWebVMInstanceSchema } from "@/lib/validations/workspace";
import { 
  getWebVMInstanceById, 
  updateWebVMInstance, 
  deleteWebVMInstance 
} from "@/lib/data/webvm-instance";
import { getUserOrganizationRole } from "@/lib/data/organization";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instance = await getWebVMInstanceById(params.id);
    if (!instance) {
      return NextResponse.json({ error: "WebVM instance not found" }, { status: 404 });
    }

    // Check if user has access to this instance's organization
    const userRole = await getUserOrganizationRole(
      session.user.id, 
      instance.workspace.project.organizationId
    );
    if (!userRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(instance);
  } catch (error) {
    console.error("Error fetching WebVM instance:", error);
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

    // First get the instance to check permissions
    const existingInstance = await getWebVMInstanceById(params.id);
    if (!existingInstance) {
      return NextResponse.json({ error: "WebVM instance not found" }, { status: 404 });
    }

    // Check if user has permission to update this instance
    const userRole = await getUserOrganizationRole(
      session.user.id, 
      existingInstance.workspace.project.organizationId
    );
    if (!userRole || (userRole !== "OWNER" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateWebVMInstanceSchema.parse(body);

    const instance = await updateWebVMInstance(params.id, validatedData);
    return NextResponse.json(instance);
  } catch (error) {
    console.error("Error updating WebVM instance:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
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

    // First get the instance to check permissions
    const existingInstance = await getWebVMInstanceById(params.id);
    if (!existingInstance) {
      return NextResponse.json({ error: "WebVM instance not found" }, { status: 404 });
    }

    // Check if user has permission to delete this instance
    const userRole = await getUserOrganizationRole(
      session.user.id, 
      existingInstance.workspace.project.organizationId
    );
    if (!userRole || (userRole !== "OWNER" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    await deleteWebVMInstance(params.id);
    return NextResponse.json({ message: "WebVM instance deleted successfully" });
  } catch (error) {
    console.error("Error deleting WebVM instance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
