import { db } from "@/lib/db";
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceQueryInput,
  BulkUpdateWorkspacesInput
} from "@/lib/validations/workspace";
import { WorkspaceType } from "@prisma/client";

// Workspace CRUD operations
export const getWorkspacesByProject = async (projectId: string) => {
  try {
    const workspaces = await db.workspace.findMany({
      where: { projectId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
        instances: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            instances: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return workspaces;
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return [];
  }
};

export const getWorkspacesByOrganization = async (organizationId: string, query?: WorkspaceQueryInput) => {
  try {
    const where: any = {
      project: { organizationId },
    };

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [workspaces, total] = await Promise.all([
      db.workspace.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              organizationId: true,
            },
          },
          instances: {
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: {
              instances: true,
            },
          },
        },
        orderBy: { [query?.sortBy || "updatedAt"]: query?.sortOrder || "desc" },
        skip: query?.page ? (query.page - 1) * (query.limit || 10) : 0,
        take: query?.limit || 10,
      }),
      db.workspace.count({ where }),
    ]);

    return {
      workspaces,
      total,
      page: query?.page || 1,
      limit: query?.limit || 10,
      totalPages: Math.ceil(total / (query?.limit || 10)),
    };
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return {
      workspaces: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }
};

export const getWorkspaceById = async (id: string) => {
  try {
    const workspace = await db.workspace.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        instances: {
          include: {
            metrics: {
              orderBy: { timestamp: "desc" },
              take: 10,
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            instances: true,
          },
        },
      },
    });
    return workspace;
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return null;
  }
};

export const createWorkspace = async (data: CreateWorkspaceInput) => {
  try {
    const workspace = await db.workspace.create({
      data,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
        _count: {
          select: {
            instances: true,
          },
        },
      },
    });
    return workspace;
  } catch (error) {
    console.error("Error creating workspace:", error);
    throw new Error("Failed to create workspace");
  }
};

export const updateWorkspace = async (id: string, data: UpdateWorkspaceInput) => {
  try {
    const workspace = await db.workspace.update({
      where: { id },
      data,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
        _count: {
          select: {
            instances: true,
          },
        },
      },
    });
    return workspace;
  } catch (error) {
    console.error("Error updating workspace:", error);
    throw new Error("Failed to update workspace");
  }
};

export const deleteWorkspace = async (id: string) => {
  try {
    await db.workspace.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting workspace:", error);
    throw new Error("Failed to delete workspace");
  }
};

export const bulkUpdateWorkspaces = async (data: BulkUpdateWorkspacesInput) => {
  try {
    const result = await db.workspace.updateMany({
      where: {
        id: { in: data.workspaceIds },
      },
      data: data.updates,
    });
    return result;
  } catch (error) {
    console.error("Error bulk updating workspaces:", error);
    throw new Error("Failed to bulk update workspaces");
  }
};

// Workspace statistics
export const getWorkspaceStats = async (organizationId: string) => {
  try {
    const [
      totalWorkspaces,
      activeWorkspaces,
      inactiveWorkspaces,
      archivedWorkspaces,
      totalInstances,
      runningInstances,
    ] = await Promise.all([
      db.workspace.count({
        where: { project: { organizationId } },
      }),
      db.workspace.count({
        where: { 
          project: { organizationId },
          status: "ACTIVE",
        },
      }),
      db.workspace.count({
        where: { 
          project: { organizationId },
          status: "INACTIVE",
        },
      }),
      db.workspace.count({
        where: { 
          project: { organizationId },
          status: "ARCHIVED",
        },
      }),
      db.webVMInstance.count({
        where: { workspace: { project: { organizationId } } },
      }),
      db.webVMInstance.count({
        where: { 
          workspace: { project: { organizationId } },
          status: "RUNNING",
        },
      }),
    ]);

    return {
      totalWorkspaces,
      activeWorkspaces,
      inactiveWorkspaces,
      archivedWorkspaces,
      errorWorkspaces: totalWorkspaces - activeWorkspaces - inactiveWorkspaces - archivedWorkspaces,
      totalInstances,
      runningInstances,
      stoppedInstances: totalInstances - runningInstances,
    };
  } catch (error) {
    console.error("Error fetching workspace stats:", error);
    return {
      totalWorkspaces: 0,
      activeWorkspaces: 0,
      inactiveWorkspaces: 0,
      archivedWorkspaces: 0,
      errorWorkspaces: 0,
      totalInstances: 0,
      runningInstances: 0,
      stoppedInstances: 0,
    };
  }
};

export const getWorkspacesByStatus = async (organizationId: string, status: string) => {
  try {
    const workspaces = await db.workspace.findMany({
      where: { 
        project: { organizationId },
        status: status as any,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            instances: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return workspaces;
  } catch (error) {
    console.error("Error fetching workspaces by status:", error);
    return [];
  }
};

// Firecracker Workspace specific functions

export const getFirecrackerWorkspaces = async (organizationId: string, query?: WorkspaceQueryInput) => {
  try {
    const where: any = {
      project: { organizationId },
      type: 'FIRECRACKER' as WorkspaceType,
    };

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query?.status) {
      where.status = query.status;
    }

    const workspaces = await db.workspace.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
        firecrackerVMs: {
          select: {
            id: true,
            name: true,
            status: true,
            vmId: true,
            createdAt: true,
            containers: {
              select: {
                id: true,
                name: true,
                status: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            firecrackerVMs: true,
          },
        },
      },
      orderBy: query?.sortBy === "name" ? { name: query.sortOrder } : { createdAt: query?.sortOrder || "desc" },
      skip: query?.page && query?.limit ? (query.page - 1) * query.limit : undefined,
      take: query?.limit,
    });

    return workspaces;
  } catch (error) {
    console.error("Error fetching Firecracker workspaces:", error);
    return [];
  }
};

export const getFirecrackerWorkspaceById = async (id: string) => {
  try {
    const workspace = await db.workspace.findUnique({
      where: {
        id,
        type: 'FIRECRACKER' as WorkspaceType
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
        firecrackerVMs: {
          include: {
            containers: {
              include: {
                logs: {
                  orderBy: { timestamp: "desc" },
                  take: 100,
                },
              },
            },
            metrics: {
              orderBy: { timestamp: "desc" },
              take: 100,
            },
            snapshots: {
              orderBy: { createdAt: "desc" },
            },
            template: true,
          },
        },
        files: {
          where: { isDirectory: false },
          orderBy: { updatedAt: "desc" },
          take: 50,
        },
        states: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    return workspace;
  } catch (error) {
    console.error("Error fetching Firecracker workspace:", error);
    return null;
  }
};

export const getFirecrackerWorkspaceStats = async (organizationId: string) => {
  try {
    const [totalWorkspaces, activeWorkspaces, totalVMs, runningVMs, totalContainers, runningContainers] = await Promise.all([
      db.workspace.count({
        where: {
          project: { organizationId },
          type: 'FIRECRACKER' as WorkspaceType,
        },
      }),
      db.workspace.count({
        where: {
          project: { organizationId },
          type: 'FIRECRACKER' as WorkspaceType,
          status: 'ACTIVE',
        },
      }),
      db.firecrackerVM.count({
        where: {
          workspace: {
            project: { organizationId },
          },
        },
      }),
      db.firecrackerVM.count({
        where: {
          workspace: {
            project: { organizationId },
          },
          status: 'RUNNING',
        },
      }),
      db.firecrackerContainer.count({
        where: {
          vm: {
            workspace: {
              project: { organizationId },
            },
          },
        },
      }),
      db.firecrackerContainer.count({
        where: {
          vm: {
            workspace: {
              project: { organizationId },
            },
          },
          status: 'RUNNING',
        },
      }),
    ]);

    return {
      totalWorkspaces,
      activeWorkspaces,
      totalVMs,
      runningVMs,
      totalContainers,
      runningContainers,
      vmUtilization: totalVMs > 0 ? Math.round((runningVMs / totalVMs) * 100) : 0,
      containerUtilization: totalContainers > 0 ? Math.round((runningContainers / totalContainers) * 100) : 0,
    };
  } catch (error) {
    console.error("Error fetching Firecracker workspace stats:", error);
    return {
      totalWorkspaces: 0,
      activeWorkspaces: 0,
      totalVMs: 0,
      runningVMs: 0,
      totalContainers: 0,
      runningContainers: 0,
      vmUtilization: 0,
      containerUtilization: 0,
    };
  }
};
