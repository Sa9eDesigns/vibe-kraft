import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization ID from query params or user's first organization
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Fetch real-time system status
    const [
      webvmStats,
      infrastructureStats,
      storageStats,
      aiStats,
      systemHealth
    ] = await Promise.all([
      getWebVMStatus(organizationId),
      getInfrastructureStatus(),
      getStorageStatus(organizationId),
      getAIServicesStatus(),
      getSystemHealthStatus()
    ]);

    const status = {
      online: true,
      cloudConnected: true,
      
      // WebVM Status
      instancesRunning: webvmStats.runningInstances,
      instancesTotal: webvmStats.totalInstances,
      workspacesActive: webvmStats.activeWorkspaces,
      workspacesTotal: webvmStats.totalWorkspaces,
      
      // Infrastructure Status
      containersRunning: infrastructureStats.runningContainers,
      containersTotal: infrastructureStats.totalContainers,
      cpuUsage: infrastructureStats.cpuUsage,
      memoryUsage: infrastructureStats.memoryUsage,
      
      // Storage Status
      storageUsed: storageStats.storageUsed,
      storageTotal: storageStats.storageTotal,
      storageHealth: storageStats.health,
      
      // AI Services Status
      aiServicesOnline: aiStats.online,
      aiRequestsPerMinute: aiStats.requestsPerMinute,
      aiResponseTime: aiStats.responseTime,
      
      // System Health
      systemHealth: systemHealth.health,
      activeAlerts: systemHealth.activeAlerts,
      uptime: systemHealth.uptime,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching system status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper functions for fetching status data
async function getWebVMStatus(organizationId: string) {
  try {
    const [totalInstances, runningInstances, totalWorkspaces, activeWorkspaces] = await Promise.all([
      db.webVMInstance.count({
        where: { workspace: { project: { organizationId } } }
      }),
      db.webVMInstance.count({
        where: { 
          workspace: { project: { organizationId } },
          status: "RUNNING"
        }
      }),
      db.workspace.count({
        where: { project: { organizationId } }
      }),
      db.workspace.count({
        where: { 
          project: { organizationId },
          status: "ACTIVE"
        }
      })
    ]);

    return {
      totalInstances,
      runningInstances,
      totalWorkspaces,
      activeWorkspaces
    };
  } catch (error) {
    console.error("Error fetching WebVM status:", error);
    return {
      totalInstances: 0,
      runningInstances: 0,
      totalWorkspaces: 0,
      activeWorkspaces: 0
    };
  }
}

async function getInfrastructureStatus() {
  // In a real implementation, this would fetch from Docker API or monitoring system
  // For now, return simulated data
  return {
    totalContainers: 10,
    runningContainers: 8,
    cpuUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
    memoryUsage: Math.floor(Math.random() * 25) + 50, // 50-75%
  };
}

async function getStorageStatus(organizationId: string) {
  try {
    const totalStorageUsed = await db.workspaceFile.aggregate({
      where: {
        workspace: {
          project: { organizationId }
        }
      },
      _sum: {
        size: true
      }
    });

    const storageUsedGB = Number(totalStorageUsed._sum.size || 0) / (1024 * 1024 * 1024);
    const storageTotalGB = 10; // 10GB quota
    const usagePercentage = (storageUsedGB / storageTotalGB) * 100;

    let health: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (usagePercentage > 90) health = 'critical';
    else if (usagePercentage > 75) health = 'warning';

    return {
      storageUsed: Math.round(storageUsedGB * 100) / 100,
      storageTotal: storageTotalGB,
      health
    };
  } catch (error) {
    console.error("Error fetching storage status:", error);
    return {
      storageUsed: 0,
      storageTotal: 10,
      health: 'healthy' as const
    };
  }
}

async function getAIServicesStatus() {
  // In a real implementation, this would check AI service endpoints
  // For now, return simulated data
  return {
    online: true,
    requestsPerMinute: Math.floor(Math.random() * 50) + 10, // 10-60 requests/min
    responseTime: Math.round((Math.random() * 2 + 0.5) * 100) / 100, // 0.5-2.5s
  };
}

async function getSystemHealthStatus() {
  // In a real implementation, this would aggregate health from monitoring system
  // For now, return simulated data
  const health = Math.floor(Math.random() * 10) + 90; // 90-100%
  const activeAlerts = Math.floor(Math.random() * 3); // 0-2 alerts
  const uptime = 99.5 + Math.random() * 0.5; // 99.5-100%

  return {
    health,
    activeAlerts,
    uptime: Math.round(uptime * 10) / 10
  };
}
