import { db } from "@/lib/db";
import { CreateProjectInput, UpdateProjectInput } from "@/lib/validations/project";

export const getProjectsByOrganization = async (organizationId: string, includeWorkspaces = false) => {
  try {
    const projects = await db.project.findMany({
      where: { organizationId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        workspaces: includeWorkspaces ? {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            config: true,
            createdAt: true,
            updatedAt: true,
          },
        } : false,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
};

export const getProjectById = async (id: string) => {
  try {
    const project = await db.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        workspaces: {
          include: {
            files: {
              select: {
                id: true,
                name: true,
                path: true,
                type: true,
                size: true,
              },
              take: 10, // Limit files for performance
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    return project;
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
};

export const createProject = async (data: CreateProjectInput) => {
  try {
    const project = await db.project.create({
      data,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    return project;
  } catch (error) {
    console.error("Error creating project:", error);
    throw new Error("Failed to create project");
  }
};

export const updateProject = async (id: string, data: UpdateProjectInput) => {
  try {
    const project = await db.project.update({
      where: { id },
      data,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    return project;
  } catch (error) {
    console.error("Error updating project:", error);
    throw new Error("Failed to update project");
  }
};

export const deleteProject = async (id: string) => {
  try {
    await db.project.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw new Error("Failed to delete project");
  }
};

export const getProjectStats = async (organizationId: string) => {
  try {
    const [totalProjects, totalTasks, completedTasks, inProgressTasks] = await Promise.all([
      db.project.count({
        where: { organizationId },
      }),
      db.task.count({
        where: {
          project: { organizationId },
        },
      }),
      db.task.count({
        where: {
          project: { organizationId },
          status: "DONE",
        },
      }),
      db.task.count({
        where: {
          project: { organizationId },
          status: "IN_PROGRESS",
        },
      }),
    ]);

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks: totalTasks - completedTasks - inProgressTasks,
    };
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return {
      totalProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      todoTasks: 0,
    };
  }
};