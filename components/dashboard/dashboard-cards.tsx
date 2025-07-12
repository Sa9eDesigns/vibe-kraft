"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Users,
  Clock,
  ArrowUpRight,
  Activity,
  Zap,
  Monitor,
  Server,
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
  Bot,
  FileText,
  Container,
  Shield,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardCardsProps {
  organizationId?: string;
}

interface DashboardStats {
  // Project & Task Stats
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;

  // User & Activity Stats
  activeUsers: number;
  recentActivity: number;

  // WebVM & Workspace Stats
  totalWorkspaces: number;
  activeWorkspaces: number;
  totalInstances: number;
  runningInstances: number;
  instanceUtilization: number;

  // Infrastructure Stats
  totalContainers: number;
  runningContainers: number;
  containerCpuUsage: number;
  containerMemoryUsage: number;

  // Storage Stats
  totalStorageUsed: number;
  totalStorageQuota: number;
  storageUtilization: number;
  totalFiles: number;

  // AI & Performance Stats
  aiRequestsToday: number;
  aiTokensUsed: number;
  avgResponseTime: number;
  systemHealth: number;

  // Security & Monitoring
  activeAlerts: number;
  securityEvents: number;
  uptime: number;
}

export function DashboardCards({ organizationId }: DashboardCardsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/dashboard/stats${organizationId ? `?organizationId=${organizationId}` : ''}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        const data = await response.json();

        // Transform the API response to match our interface
        const transformedStats: DashboardStats = {
          // Project & Task Stats
          totalProjects: data.overview?.totalProjects || 0,
          totalTasks: data.overview?.totalTasks || 0,
          completedTasks: data.overview?.completedTasks || 0,
          taskCompletionRate: data.overview?.completionRate || 0,

          // User & Activity Stats
          activeUsers: data.overview?.activeUsers || 0,
          recentActivity: data.overview?.recentActivity || 0,

          // WebVM & Workspace Stats
          totalWorkspaces: data.overview?.totalWorkspaces || 0,
          activeWorkspaces: data.overview?.activeWorkspaces || 0,
          totalInstances: data.overview?.totalInstances || 0,
          runningInstances: data.overview?.runningInstances || 0,
          instanceUtilization: data.overview?.instanceUtilization || 0,

          // Infrastructure Stats (simulated for now)
          totalContainers: data.infrastructure?.totalContainers || 0,
          runningContainers: data.infrastructure?.runningContainers || 0,
          containerCpuUsage: data.infrastructure?.containerCpuUsage || 0,
          containerMemoryUsage: data.infrastructure?.containerMemoryUsage || 0,

          // Storage Stats (simulated for now)
          totalStorageUsed: data.storage?.totalStorageUsed || 0,
          totalStorageQuota: data.storage?.totalStorageQuota || 10737418240, // 10GB default
          storageUtilization: data.storage?.storageUtilization || 0,
          totalFiles: data.storage?.totalFiles || 0,

          // AI & Performance Stats (simulated for now)
          aiRequestsToday: data.ai?.requestsToday || 0,
          aiTokensUsed: data.ai?.tokensUsed || 0,
          avgResponseTime: data.performance?.avgResponseTime || 0,
          systemHealth: data.performance?.systemHealth || 95,

          // Security & Monitoring (simulated for now)
          activeAlerts: data.monitoring?.activeAlerts || 0,
          securityEvents: data.security?.events || 0,
          uptime: data.performance?.uptime || 99.9,
        };

        setStats(transformedStats);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        // Set default values on error
        setStats({
          totalProjects: 0,
          totalTasks: 0,
          completedTasks: 0,
          taskCompletionRate: 0,
          activeUsers: 0,
          recentActivity: 0,
          totalWorkspaces: 0,
          activeWorkspaces: 0,
          totalInstances: 0,
          runningInstances: 0,
          instanceUtilization: 0,
          totalContainers: 0,
          runningContainers: 0,
          containerCpuUsage: 0,
          containerMemoryUsage: 0,
          totalStorageUsed: 0,
          totalStorageQuota: 10737418240,
          storageUtilization: 0,
          totalFiles: 0,
          aiRequestsToday: 0,
          aiTokensUsed: 0,
          avgResponseTime: 0,
          systemHealth: 95,
          activeAlerts: 0,
          securityEvents: 0,
          uptime: 99.9,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  // Helper function to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const cards = [
    // Project & Development Cards
    {
      title: "Total Projects",
      value: stats.totalProjects,
      description: "Active projects in workspace",
      icon: Package,
      trend: "+2.5%",
      trendUp: true,
      category: "development",
    },
    {
      title: "Task Completion",
      value: `${stats.taskCompletionRate}%`,
      description: "Tasks completed this week",
      icon: Clock,
      trend: stats.taskCompletionRate > 75 ? "+8%" : "-3%",
      trendUp: stats.taskCompletionRate > 75,
      showProgress: true,
      category: "development",
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      description: "Tasks across all projects",
      icon: Activity,
      trend: "+5%",
      trendUp: true,
      category: "development",
    },

    // WebVM & Workspace Cards
    {
      title: "WebVM Workspaces",
      value: stats.totalWorkspaces,
      description: `${stats.activeWorkspaces} active workspaces`,
      icon: Monitor,
      trend: "+12%",
      trendUp: true,
      category: "webvm",
    },
    {
      title: "WebVM Instances",
      value: stats.totalInstances,
      description: `${stats.runningInstances} running instances`,
      icon: Server,
      trend: stats.instanceUtilization > 80 ? "+15%" : "+8%",
      trendUp: true,
      category: "webvm",
    },
    {
      title: "Instance Utilization",
      value: `${stats.instanceUtilization}%`,
      description: "WebVM resource usage",
      icon: Cpu,
      trend: stats.instanceUtilization > 80 ? "+5%" : "-2%",
      trendUp: stats.instanceUtilization <= 80,
      showProgress: true,
      category: "webvm",
    },

    // Infrastructure Cards
    {
      title: "Containers",
      value: stats.totalContainers,
      description: `${stats.runningContainers} running containers`,
      icon: Container,
      trend: "+3%",
      trendUp: true,
      category: "infrastructure",
    },
    {
      title: "CPU Usage",
      value: `${stats.containerCpuUsage}%`,
      description: "Average container CPU",
      icon: Cpu,
      trend: stats.containerCpuUsage > 80 ? "+10%" : "-5%",
      trendUp: stats.containerCpuUsage <= 80,
      showProgress: true,
      category: "infrastructure",
    },
    {
      title: "Memory Usage",
      value: `${stats.containerMemoryUsage}%`,
      description: "Container memory usage",
      icon: MemoryStick,
      trend: stats.containerMemoryUsage > 85 ? "+8%" : "-3%",
      trendUp: stats.containerMemoryUsage <= 85,
      showProgress: true,
      category: "infrastructure",
    },

    // Storage Cards
    {
      title: "Storage Used",
      value: formatBytes(stats.totalStorageUsed),
      description: `${stats.storageUtilization}% of quota used`,
      icon: HardDrive,
      trend: stats.storageUtilization > 80 ? "+15%" : "+5%",
      trendUp: stats.storageUtilization <= 80,
      category: "storage",
    },
    {
      title: "Total Files",
      value: formatNumber(stats.totalFiles),
      description: "Files across all workspaces",
      icon: FileText,
      trend: "+7%",
      trendUp: true,
      category: "storage",
    },

    // AI & Performance Cards
    {
      title: "AI Requests",
      value: formatNumber(stats.aiRequestsToday),
      description: "AI requests today",
      icon: Bot,
      trend: "+25%",
      trendUp: true,
      category: "ai",
    },
    {
      title: "System Health",
      value: `${stats.systemHealth}%`,
      description: "Overall system status",
      icon: Shield,
      trend: stats.systemHealth > 95 ? "+0.5%" : "-2%",
      trendUp: stats.systemHealth > 95,
      showProgress: true,
      category: "monitoring",
    },

    // User & Activity Cards
    {
      title: "Active Users",
      value: stats.activeUsers,
      description: "Team members online",
      icon: Users,
      trend: "+12%",
      trendUp: true,
      category: "users",
    },
    {
      title: "Recent Activity",
      value: stats.recentActivity,
      description: "Actions in last 24 hours",
      icon: Zap,
      trend: "+15%",
      trendUp: true,
      category: "activity",
    },

    // Monitoring Cards
    {
      title: "Active Alerts",
      value: stats.activeAlerts,
      description: "System alerts requiring attention",
      icon: AlertTriangle,
      trend: stats.activeAlerts > 0 ? "+100%" : "0%",
      trendUp: false,
      category: "monitoring",
    },
    {
      title: "Uptime",
      value: `${stats.uptime}%`,
      description: "System availability",
      icon: TrendingUp,
      trend: "+0.1%",
      trendUp: true,
      showProgress: true,
      category: "monitoring",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card, i) => {
        // Determine progress value based on card type
        let progressValue = 0;
        if (card.showProgress) {
          switch (card.title) {
            case "Task Completion":
              progressValue = stats.taskCompletionRate;
              break;
            case "Instance Utilization":
              progressValue = stats.instanceUtilization;
              break;
            case "CPU Usage":
              progressValue = stats.containerCpuUsage;
              break;
            case "Memory Usage":
              progressValue = stats.containerMemoryUsage;
              break;
            case "System Health":
              progressValue = stats.systemHealth;
              break;
            case "Uptime":
              progressValue = stats.uptime;
              break;
            default:
              progressValue = 0;
          }
        }

        // Determine progress color based on value and card type
        let progressColor = "bg-primary";
        if (card.showProgress) {
          if (card.title === "CPU Usage" || card.title === "Memory Usage") {
            progressColor = progressValue > 80 ? "bg-destructive" : progressValue > 60 ? "bg-yellow-500" : "bg-primary";
          } else if (card.title === "Instance Utilization") {
            progressColor = progressValue > 90 ? "bg-destructive" : progressValue > 70 ? "bg-yellow-500" : "bg-primary";
          } else if (card.title === "System Health" || card.title === "Uptime") {
            progressColor = progressValue < 90 ? "bg-destructive" : progressValue < 95 ? "bg-yellow-500" : "bg-green-500";
          }
        }

        return (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{card.value}</div>
                <Badge
                  variant={card.trendUp ? "default" : "destructive"}
                  className={`text-xs ${card.trendUp ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}
                >
                  {card.trend}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              {card.showProgress && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{progressValue}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                      style={{ width: `${Math.min(progressValue, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
