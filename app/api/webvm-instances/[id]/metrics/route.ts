import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createWebVMMetricSchema } from "@/lib/validations/workspace";
import { 
  getWebVMInstanceById,
  createWebVMMetric,
  getWebVMMetrics 
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

    // First get the instance to check permissions
    const existingInstance = await getWebVMInstanceById(params.id);
    if (!existingInstance) {
      return NextResponse.json({ error: "WebVM instance not found" }, { status: 404 });
    }

    // Check if user has access to this instance's organization
    const userRole = await getUserOrganizationRole(
      session.user.id, 
      existingInstance.workspace.project.organizationId
    );
    if (!userRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get("metricType") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");

    const metrics = await getWebVMMetrics(params.id, metricType, limit);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching WebVM metrics:", error);
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

    // First get the instance to check permissions
    const existingInstance = await getWebVMInstanceById(params.id);
    if (!existingInstance) {
      return NextResponse.json({ error: "WebVM instance not found" }, { status: 404 });
    }

    // Check if user has permission to create metrics for this instance
    const userRole = await getUserOrganizationRole(
      session.user.id, 
      existingInstance.workspace.project.organizationId
    );
    if (!userRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createWebVMMetricSchema.parse({
      ...body,
      instanceId: params.id,
    });

    const metric = await createWebVMMetric(validatedData);
    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    console.error("Error creating WebVM metric:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
