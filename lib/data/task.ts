import { db } from "@/lib/db";
import { CreateTaskInput, UpdateTaskInput } from "@/lib/validations/project";

export const getTasksByProject = async (projectId: string) => {
  try {
    const tasks = await db.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return tasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
};

export const getTasksByUser = async (userId: string, organizationId?: string) => {
  try {
    const tasks = await db.task.findMany({
      where: {
        assigneeId: userId,
        ...(organizationId && {
          project: {
            organizationId,
          },
        }),
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return tasks;
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    return [];
  }
};

export const getRecentTasks = async (organizationId: string, limit: number = 5) => {
  try {
    const tasks = await db.task.findMany({
      where: {
        project: {
          organizationId,
        },
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return tasks;
  } catch (error) {
    console.error("Error fetching recent tasks:", error);
    return [];
  }
};

export const getTaskById = async (id: string) => {
  try {
    const task = await db.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
    });
    return task;
  } catch (error) {
    console.error("Error fetching task:", error);
    return null;
  }
};

export const createTask = async (data: CreateTaskInput) => {
  try {
    const taskData = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    };

    const task = await db.task.create({
      data: taskData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return task;
  } catch (error) {
    console.error("Error creating task:", error);
    throw new Error("Failed to create task");
  }
};

export const updateTask = async (id: string, data: UpdateTaskInput) => {
  try {
    const updateData = {
      ...data,
      ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
    };

    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return task;
  } catch (error) {
    console.error("Error updating task:", error);
    throw new Error("Failed to update task");
  }
};

export const deleteTask = async (id: string) => {
  try {
    await db.task.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw new Error("Failed to delete task");
  }
};

export const updateTaskStatus = async (id: string, status: "TODO" | "IN_PROGRESS" | "DONE") => {
  try {
    const task = await db.task.update({
      where: { id },
      data: { status },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return task;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw new Error("Failed to update task status");
  }
};