import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createTaskSchema } from "@/lib/validations/project";
import { createTask, getTasksByProject, getTasksByUser } from "@/lib/data/task";
import { getProjectById } from "@/lib/data/project";
import { getUserOrganizationRole } from "@/lib/data/organization";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");
    const organizationId = searchParams.get("organizationId");

    if (projectId) {
      // Get tasks by project
      const project = await getProjectById(projectId);
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      // Check if user has access to this project's organization
      const userRole = await getUserOrganizationRole(session.user.id, project.organizationId);
      if (!userRole) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const tasks = await getTasksByProject(projectId);
      return NextResponse.json(tasks);
    } else if (userId) {
      // Get tasks by user (only allow users to see their own tasks unless admin)
      if (userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const tasks = await getTasksByUser(userId, organizationId || undefined);
      return NextResponse.json(tasks);
    } else {
      return NextResponse.json({ error: "Project ID or User ID is required" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error fetching tasks:", error);
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
    const validatedData = createTaskSchema.parse(body);

    // Check if user has access to the project
    const project = await getProjectById(validatedData.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has permission to create tasks in this organization
    const userRole = await getUserOrganizationRole(session.user.id, project.organizationId);
    if (!userRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const task = await createTask(validatedData);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}