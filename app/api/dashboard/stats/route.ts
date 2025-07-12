import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProjectStats } from "@/lib/data/project";
import { getWorkspaceStats } from "@/lib/data/workspace";
import { getWebVMInstanceStats } from "@/lib/data/webvm-instance";
import { getUserOrganizationRole } from "@/lib/data/organization";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Check if user is a member of the organization
    const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    if (!userRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch all stats in parallel
    const [
      projectStats,
      workspaceStats,
      instanceStats,
      storageStats,
      infrastructureStats,
      aiStats,
      monitoringStats
    ] = await Promise.all([
      getProjectStats(organizationId),
      getWorkspaceStats(organizationId),
      getWebVMInstanceStats(organizationId),
      getStorageStats(organizationId),
      getInfrastructureStats(organizationId),
      getAIStats(organizationId),
      getMonitoringStats(organizationId),
    ]);

    const dashboardStats = {
      projects: projectStats,
      workspaces: workspaceStats,
      instances: instanceStats,
      storage: storageStats,
      infrastructure: infrastructureStats,
      ai: aiStats,
      monitoring: monitoringStats,
      overview: {
        // Project & Task Stats
        totalProjects: projectStats.totalProjects,
        totalTasks: projectStats.totalTasks,
        completedTasks: projectStats.completedTasks,
        completionRate: projectStats.totalTasks > 0
          ? Math.round((projectStats.completedTasks / projectStats.totalTasks) * 100)
          : 0,

        // User & Activity Stats
        activeUsers: await getActiveUsersCount(organizationId),
        recentActivity: await getRecentActivityCount(organizationId),

        // WebVM & Workspace Stats
        totalWorkspaces: workspaceStats.totalWorkspaces,
        activeWorkspaces: workspaceStats.activeWorkspaces,
        totalInstances: instanceStats.totalInstances,
        runningInstances: instanceStats.runningInstances,
        instanceUtilization: instanceStats.totalInstances > 0
          ? Math.round((instanceStats.runningInstances / instanceStats.totalInstances) * 100)
          : 0,
      },
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper functions for additional stats
async function getStorageStats(organizationId: string) {
  try {
    const [totalFiles, totalStorageUsed] = await Promise.all([
      db.workspaceFile.count({
        where: {
          workspace: {
            project: { organizationId }
          }
        }
      }),
      db.workspaceFile.aggregate({
        where: {
          workspace: {
            project: { organizationId }
          }
        },
        _sum: {
          size: true
        }
      })
    ]);

    const totalStorageBytes = Number(totalStorageUsed._sum.size || 0);
    const totalStorageQuota = 10 * 1024 * 1024 * 1024; // 10GB default quota
    const storageUtilization = totalStorageQuota > 0
      ? Math.round((totalStorageBytes / totalStorageQuota) * 100)
      : 0;

    return {
      totalFiles,
      totalStorageUsed: totalStorageBytes,
      totalStorageQuota,
      storageUtilization,
    };
  } catch (error) {
    console.error("Error fetching storage stats:", error);
    return {
      totalFiles: 0,
      totalStorageUsed: 0,
      totalStorageQuota: 10 * 1024 * 1024 * 1024,
      storageUtilization: 0,
    };
  }
}

async function getInfrastructureStats(organizationId: string) {
  try {
    // For now, return simulated data since container stats would come from Docker API
    // In a real implementation, you'd integrate with Docker API or monitoring system
    const totalContainers = 8; // Simulated
    const runningContainers = 6; // Simulated
    const containerCpuUsage = Math.floor(Math.random() * 30) + 40; // 40-70%
    const containerMemoryUsage = Math.floor(Math.random() * 25) + 50; // 50-75%

    return {
      totalContainers,
      runningContainers,
      containerCpuUsage,
      containerMemoryUsage,
    };
  } catch (error) {
    console.error("Error fetching infrastructure stats:", error);
    return {
      totalContainers: 0,
      runningContainers: 0,
      containerCpuUsage: 0,
      containerMemoryUsage: 0,
    };
  }
}

async function getAIStats(organizationId: string) {
  try {
    // For now, return simulated data
    // In a real implementation, you'd track AI API usage
    const requestsToday = Math.floor(Math.random() * 500) + 100; // 100-600 requests
    const tokensUsed = Math.floor(Math.random() * 50000) + 10000; // 10K-60K tokens

    return {
      requestsToday,
      tokensUsed,
    };
  } catch (error) {
    console.error("Error fetching AI stats:", error);
    return {
      requestsToday: 0,
      tokensUsed: 0,
    };
  }
}

async function getMonitoringStats(organizationId: string) {
  try {
    // For now, return simulated data
    // In a real implementation, you'd integrate with monitoring system
    const activeAlerts = Math.floor(Math.random() * 3); // 0-2 alerts
    const systemHealth = Math.floor(Math.random() * 10) + 90; // 90-100%
    const uptime = 99.5 + Math.random() * 0.5; // 99.5-100%

    return {
      activeAlerts,
      systemHealth,
      uptime: Math.round(uptime * 10) / 10,
    };
  } catch (error) {
    console.error("Error fetching monitoring stats:", error);
    return {
      activeAlerts: 0,
      systemHealth: 95,
      uptime: 99.9,
    };
  }
}

async function getActiveUsersCount(organizationId: string) {
  try {
    // Count users who have been active in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const activeUsers = await db.user.count({
      where: {
        organizations: {
          some: {
            organizationId,
          }
        },
        // In a real implementation, you'd track last activity timestamp
        updatedAt: {
          gte: oneHourAgo
        }
      }
    });

    return activeUsers;
  } catch (error) {
    console.error("Error fetching active users count:", error);
    return 0;
  }
}

async function getRecentActivityCount(organizationId: string) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Count recent activities (tasks created/updated, workspaces created, etc.)
    const [recentTasks, recentWorkspaces, recentInstances] = await Promise.all([
      db.task.count({
        where: {
          project: { organizationId },
          updatedAt: {
            gte: twentyFourHoursAgo
          }
        }
      }),
      db.workspace.count({
        where: {
          project: { organizationId },
          updatedAt: {
            gte: twentyFourHoursAgo
          }
        }
      }),
      db.webVMInstance.count({
        where: {
          workspace: {
            project: { organizationId }
          },
          updatedAt: {
            gte: twentyFourHoursAgo
          }
        }
      })
    ]);

    return recentTasks + recentWorkspaces + recentInstances;
  } catch (error) {
    console.error("Error fetching recent activity count:", error);
    return 0;
  }
}
