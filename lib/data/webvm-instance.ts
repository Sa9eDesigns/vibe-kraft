import { db } from "@/lib/db";
import { 
  CreateWebVMInstanceInput, 
  UpdateWebVMInstanceInput, 
  WebVMInstanceQueryInput,
  BulkUpdateWebVMInstancesInput,
  CreateWebVMMetricInput 
} from "@/lib/validations/workspace";

// WebVM Instance CRUD operations
export const getWebVMInstancesByWorkspace = async (workspaceId: string) => {
  try {
    const instances = await db.webVMInstance.findMany({
      where: { workspaceId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
        metrics: {
          orderBy: { timestamp: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return instances;
  } catch (error) {
    console.error("Error fetching WebVM instances:", error);
    return [];
  }
};

export const getWebVMInstancesByOrganization = async (organizationId: string, query?: WebVMInstanceQueryInput) => {
  try {
    const where: any = {
      workspace: { 
        project: { organizationId } 
      },
    };

    if (query?.workspaceId) {
      where.workspaceId = query.workspaceId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { workspace: { name: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [instances, total] = await Promise.all([
      db.webVMInstance.findMany({
        where,
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              projectId: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          metrics: {
            orderBy: { timestamp: "desc" },
            take: 5,
          },
        },
        orderBy: { [query?.sortBy || "updatedAt"]: query?.sortOrder || "desc" },
        skip: query?.page ? (query.page - 1) * (query.limit || 10) : 0,
        take: query?.limit || 10,
      }),
      db.webVMInstance.count({ where }),
    ]);

    return {
      instances,
      total,
      page: query?.page || 1,
      limit: query?.limit || 10,
      totalPages: Math.ceil(total / (query?.limit || 10)),
    };
  } catch (error) {
    console.error("Error fetching WebVM instances:", error);
    return {
      instances: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }
};

export const getWebVMInstanceById = async (id: string) => {
  try {
    const instance = await db.webVMInstance.findUnique({
      where: { id },
      include: {
        workspace: {
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
          },
        },
        metrics: {
          orderBy: { timestamp: "desc" },
          take: 50,
        },
      },
    });
    return instance;
  } catch (error) {
    console.error("Error fetching WebVM instance:", error);
    return null;
  }
};

export const createWebVMInstance = async (data: CreateWebVMInstanceInput) => {
  try {
    const instance = await db.webVMInstance.create({
      data: {
        ...data,
        status: "STOPPED", // Default status
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
      },
    });
    return instance;
  } catch (error) {
    console.error("Error creating WebVM instance:", error);
    throw new Error("Failed to create WebVM instance");
  }
};

export const updateWebVMInstance = async (id: string, data: UpdateWebVMInstanceInput) => {
  try {
    const updateData: any = { ...data };
    
    // Handle status transitions
    if (data.status === "RUNNING" && !data.connectionUrl) {
      updateData.startedAt = new Date();
    } else if (data.status === "STOPPED") {
      updateData.stoppedAt = new Date();
      updateData.connectionUrl = null;
    }

    const instance = await db.webVMInstance.update({
      where: { id },
      data: updateData,
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
      },
    });
    return instance;
  } catch (error) {
    console.error("Error updating WebVM instance:", error);
    throw new Error("Failed to update WebVM instance");
  }
};

export const deleteWebVMInstance = async (id: string) => {
  try {
    await db.webVMInstance.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting WebVM instance:", error);
    throw new Error("Failed to delete WebVM instance");
  }
};

export const bulkUpdateWebVMInstances = async (data: BulkUpdateWebVMInstancesInput) => {
  try {
    const result = await db.webVMInstance.updateMany({
      where: {
        id: { in: data.instanceIds },
      },
      data: data.updates,
    });
    return result;
  } catch (error) {
    console.error("Error bulk updating WebVM instances:", error);
    throw new Error("Failed to bulk update WebVM instances");
  }
};

// WebVM Instance control operations
export const startWebVMInstance = async (id: string) => {
  try {
    const instance = await db.webVMInstance.update({
      where: { id },
      data: {
        status: "STARTING",
        startedAt: new Date(),
      },
    });
    
    // Here you would integrate with CheerpX to actually start the instance
    // For now, we'll simulate it by updating to RUNNING after a delay
    
    return instance;
  } catch (error) {
    console.error("Error starting WebVM instance:", error);
    throw new Error("Failed to start WebVM instance");
  }
};

export const stopWebVMInstance = async (id: string) => {
  try {
    const instance = await db.webVMInstance.update({
      where: { id },
      data: {
        status: "STOPPING",
      },
    });
    
    // Here you would integrate with CheerpX to actually stop the instance
    // For now, we'll simulate it
    
    return instance;
  } catch (error) {
    console.error("Error stopping WebVM instance:", error);
    throw new Error("Failed to stop WebVM instance");
  }
};

export const restartWebVMInstance = async (id: string) => {
  try {
    // First stop, then start
    await stopWebVMInstance(id);
    const instance = await startWebVMInstance(id);
    return instance;
  } catch (error) {
    console.error("Error restarting WebVM instance:", error);
    throw new Error("Failed to restart WebVM instance");
  }
};

// WebVM Metrics operations
export const createWebVMMetric = async (data: CreateWebVMMetricInput) => {
  try {
    const metric = await db.webVMMetric.create({
      data,
    });
    return metric;
  } catch (error) {
    console.error("Error creating WebVM metric:", error);
    throw new Error("Failed to create WebVM metric");
  }
};

export const getWebVMMetrics = async (instanceId: string, metricType?: string, limit = 100) => {
  try {
    const where: any = { instanceId };
    if (metricType) {
      where.metricType = metricType;
    }

    const metrics = await db.webVMMetric.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    return metrics;
  } catch (error) {
    console.error("Error fetching WebVM metrics:", error);
    return [];
  }
};

// WebVM Instance statistics
export const getWebVMInstanceStats = async (organizationId: string) => {
  try {
    const [
      totalInstances,
      runningInstances,
      stoppedInstances,
      errorInstances,
      startingInstances,
      stoppingInstances,
    ] = await Promise.all([
      db.webVMInstance.count({
        where: { workspace: { project: { organizationId } } },
      }),
      db.webVMInstance.count({
        where: { 
          workspace: { project: { organizationId } },
          status: "RUNNING",
        },
      }),
      db.webVMInstance.count({
        where: { 
          workspace: { project: { organizationId } },
          status: "STOPPED",
        },
      }),
      db.webVMInstance.count({
        where: { 
          workspace: { project: { organizationId } },
          status: "ERROR",
        },
      }),
      db.webVMInstance.count({
        where: { 
          workspace: { project: { organizationId } },
          status: "STARTING",
        },
      }),
      db.webVMInstance.count({
        where: { 
          workspace: { project: { organizationId } },
          status: "STOPPING",
        },
      }),
    ]);

    return {
      totalInstances,
      runningInstances,
      stoppedInstances,
      errorInstances,
      startingInstances,
      stoppingInstances,
      suspendedInstances: totalInstances - runningInstances - stoppedInstances - errorInstances - startingInstances - stoppingInstances,
    };
  } catch (error) {
    console.error("Error fetching WebVM instance stats:", error);
    return {
      totalInstances: 0,
      runningInstances: 0,
      stoppedInstances: 0,
      errorInstances: 0,
      startingInstances: 0,
      stoppingInstances: 0,
      suspendedInstances: 0,
    };
  }
};
