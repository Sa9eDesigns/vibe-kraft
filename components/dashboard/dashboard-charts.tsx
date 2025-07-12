"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Code,
  Clock,
  Monitor,
  Server,
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
  Bot,
  Container,
  Zap,
  Shield
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface DashboardChartsProps {
  className?: string;
  organizationId?: string;
}

interface ChartData {
  projectActivity: Array<{
    date: string;
    projects: number;
    tasks: number;
    commits: number;
  }>;
  taskCompletion: Array<{
    week: string;
    completed: number;
    pending: number;
    inProgress: number;
  }>;
  userActivity: Array<{
    hour: string;
    activeUsers: number;
  }>;
  projectDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  webvmMetrics: Array<{
    time: string;
    instances: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  }>;
  infrastructureMetrics: Array<{
    time: string;
    containers: number;
    cpuLoad: number;
    memoryLoad: number;
    networkIn: number;
    networkOut: number;
  }>;
  storageMetrics: Array<{
    date: string;
    totalFiles: number;
    storageUsed: number;
    storageQuota: number;
  }>;
  aiUsageMetrics: Array<{
    date: string;
    requests: number;
    tokens: number;
    responseTime: number;
  }>;
  systemHealth: Array<{
    time: string;
    health: number;
    uptime: number;
    alerts: number;
  }>;
}

const chartConfig = {
  // Project & Development
  projects: {
    label: "Projects",
    color: "hsl(var(--chart-1))",
  },
  tasks: {
    label: "Tasks",
    color: "hsl(var(--chart-2))",
  },
  commits: {
    label: "Commits",
    color: "hsl(var(--chart-3))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-2))",
  },
  inProgress: {
    label: "In Progress",
    color: "hsl(var(--chart-3))",
  },
  activeUsers: {
    label: "Active Users",
    color: "hsl(var(--chart-4))",
  },

  // WebVM & Infrastructure
  instances: {
    label: "Instances",
    color: "hsl(var(--chart-1))",
  },
  cpuUsage: {
    label: "CPU Usage",
    color: "hsl(var(--chart-2))",
  },
  memoryUsage: {
    label: "Memory Usage",
    color: "hsl(var(--chart-3))",
  },
  diskUsage: {
    label: "Disk Usage",
    color: "hsl(var(--chart-4))",
  },
  containers: {
    label: "Containers",
    color: "hsl(var(--chart-5))",
  },
  cpuLoad: {
    label: "CPU Load",
    color: "hsl(var(--chart-1))",
  },
  memoryLoad: {
    label: "Memory Load",
    color: "hsl(var(--chart-2))",
  },
  networkIn: {
    label: "Network In",
    color: "hsl(var(--chart-3))",
  },
  networkOut: {
    label: "Network Out",
    color: "hsl(var(--chart-4))",
  },

  // Storage & Files
  totalFiles: {
    label: "Total Files",
    color: "hsl(var(--chart-1))",
  },
  storageUsed: {
    label: "Storage Used",
    color: "hsl(var(--chart-2))",
  },
  storageQuota: {
    label: "Storage Quota",
    color: "hsl(var(--chart-3))",
  },

  // AI & Performance
  requests: {
    label: "AI Requests",
    color: "hsl(var(--chart-1))",
  },
  tokens: {
    label: "Tokens Used",
    color: "hsl(var(--chart-2))",
  },
  responseTime: {
    label: "Response Time",
    color: "hsl(var(--chart-3))",
  },
  health: {
    label: "System Health",
    color: "hsl(var(--chart-1))",
  },
  uptime: {
    label: "Uptime",
    color: "hsl(var(--chart-2))",
  },
  alerts: {
    label: "Active Alerts",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

// Helper function to generate mock chart data
function generateMockChartData(): ChartData {
  return {
    projectActivity: [
      { date: "2024-01", projects: 12, tasks: 45, commits: 89 },
      { date: "2024-02", projects: 15, tasks: 52, commits: 102 },
      { date: "2024-03", projects: 18, tasks: 61, commits: 118 },
      { date: "2024-04", projects: 22, tasks: 68, commits: 134 },
      { date: "2024-05", projects: 25, tasks: 75, commits: 145 },
      { date: "2024-06", projects: 28, tasks: 82, commits: 156 },
    ],
    taskCompletion: [
      { week: "Week 1", completed: 23, pending: 12, inProgress: 8 },
      { week: "Week 2", completed: 28, pending: 15, inProgress: 6 },
      { week: "Week 3", completed: 32, pending: 10, inProgress: 9 },
      { week: "Week 4", completed: 35, pending: 8, inProgress: 7 },
    ],
    userActivity: [
      { hour: "00:00", activeUsers: 2 },
      { hour: "04:00", activeUsers: 1 },
      { hour: "08:00", activeUsers: 8 },
      { hour: "12:00", activeUsers: 15 },
      { hour: "16:00", activeUsers: 12 },
      { hour: "20:00", activeUsers: 6 },
    ],
    projectDistribution: [
      { name: "WebVM Projects", value: 35, color: "#8884d8" },
      { name: "Frontend", value: 25, color: "#82ca9d" },
      { name: "Backend", value: 20, color: "#ffc658" },
      { name: "DevOps", value: 15, color: "#ff7300" },
      { name: "Other", value: 5, color: "#00ff00" },
    ],
    webvmMetrics: [
      { time: "00:00", instances: 8, cpuUsage: 45, memoryUsage: 62, diskUsage: 35 },
      { time: "04:00", instances: 6, cpuUsage: 32, memoryUsage: 48, diskUsage: 36 },
      { time: "08:00", instances: 12, cpuUsage: 68, memoryUsage: 75, diskUsage: 42 },
      { time: "12:00", instances: 15, cpuUsage: 78, memoryUsage: 82, diskUsage: 48 },
      { time: "16:00", instances: 14, cpuUsage: 72, memoryUsage: 78, diskUsage: 45 },
      { time: "20:00", instances: 10, cpuUsage: 55, memoryUsage: 65, diskUsage: 40 },
    ],
    infrastructureMetrics: [
      { time: "00:00", containers: 8, cpuLoad: 25, memoryLoad: 45, networkIn: 120, networkOut: 85 },
      { time: "04:00", containers: 8, cpuLoad: 18, memoryLoad: 38, networkIn: 95, networkOut: 62 },
      { time: "08:00", containers: 10, cpuLoad: 45, memoryLoad: 62, networkIn: 180, networkOut: 145 },
      { time: "12:00", containers: 12, cpuLoad: 58, memoryLoad: 72, networkIn: 220, networkOut: 185 },
      { time: "16:00", containers: 11, cpuLoad: 52, memoryLoad: 68, networkIn: 195, networkOut: 165 },
      { time: "20:00", containers: 9, cpuLoad: 35, memoryLoad: 55, networkIn: 150, networkOut: 125 },
    ],
    storageMetrics: [
      { date: "2024-01", totalFiles: 1250, storageUsed: 2.1, storageQuota: 10 },
      { date: "2024-02", totalFiles: 1420, storageUsed: 2.8, storageQuota: 10 },
      { date: "2024-03", totalFiles: 1680, storageUsed: 3.5, storageQuota: 10 },
      { date: "2024-04", totalFiles: 1950, storageUsed: 4.2, storageQuota: 10 },
      { date: "2024-05", totalFiles: 2280, storageUsed: 5.1, storageQuota: 10 },
      { date: "2024-06", totalFiles: 2650, storageUsed: 6.2, storageQuota: 10 },
    ],
    aiUsageMetrics: [
      { date: "2024-01", requests: 450, tokens: 12500, responseTime: 1.2 },
      { date: "2024-02", requests: 620, tokens: 18200, responseTime: 1.1 },
      { date: "2024-03", requests: 780, tokens: 24800, responseTime: 1.3 },
      { date: "2024-04", requests: 950, tokens: 32100, responseTime: 1.0 },
      { date: "2024-05", requests: 1150, tokens: 38900, responseTime: 0.9 },
      { date: "2024-06", requests: 1380, tokens: 45600, responseTime: 0.8 },
    ],
    systemHealth: [
      { time: "00:00", health: 98, uptime: 99.9, alerts: 0 },
      { time: "04:00", health: 97, uptime: 99.8, alerts: 1 },
      { time: "08:00", health: 95, uptime: 99.7, alerts: 2 },
      { time: "12:00", health: 96, uptime: 99.8, alerts: 1 },
      { time: "16:00", health: 98, uptime: 99.9, alerts: 0 },
      { time: "20:00", health: 99, uptime: 99.9, alerts: 0 },
    ],
  };
}

export function DashboardCharts({ className, organizationId }: DashboardChartsProps) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Simulated API call - replace with actual data fetching
        const response = await fetch(`/api/dashboard/charts${organizationId ? `?orgId=${organizationId}` : ''}`);

        if (!response.ok) {
          // Fallback to mock data if API fails
          setData(generateMockChartData());
        }
        } else {
          const chartData = await response.json();
          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
        // Set mock data on error
        setData(generateMockChartData());

      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [organizationId]);

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Unable to load chart data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Project Activity Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Project Activity
            </CardTitle>
            <CardDescription>
              Projects, tasks, and commits over time
            </CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +12% this month
          </Badge>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <AreaChart data={data.projectActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="projects"
                stackId="1"
                stroke="var(--color-projects)"
                fill="var(--color-projects)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="tasks"
                stackId="1"
                stroke="var(--color-tasks)"
                fill="var(--color-tasks)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="commits"
                stackId="1"
                stroke="var(--color-commits)"
                fill="var(--color-commits)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Task Completion Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Task Completion Trends
          </CardTitle>
          <CardDescription>
            Weekly task completion breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={data.taskCompletion}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="completed" fill="var(--color-completed)" />
              <Bar dataKey="inProgress" fill="var(--color-inProgress)" />
              <Bar dataKey="pending" fill="var(--color-pending)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* User Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Activity
          </CardTitle>
          <CardDescription>
            Active users throughout the day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <LineChart data={data.userActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke="var(--color-activeUsers)"
                strokeWidth={2}
                dot={{ fill: "var(--color-activeUsers)" }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* WebVM Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            WebVM Performance
          </CardTitle>
          <CardDescription>
            WebVM instances and resource utilization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <AreaChart data={data.webvmMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="cpuUsage"
                stackId="1"
                stroke="var(--color-cpuUsage)"
                fill="var(--color-cpuUsage)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="memoryUsage"
                stackId="2"
                stroke="var(--color-memoryUsage)"
                fill="var(--color-memoryUsage)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="diskUsage"
                stackId="3"
                stroke="var(--color-diskUsage)"
                fill="var(--color-diskUsage)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Infrastructure Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Infrastructure Metrics
          </CardTitle>
          <CardDescription>
            Container and system resource usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={data.infrastructureMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="cpuLoad"
                stroke="var(--color-cpuLoad)"
                strokeWidth={2}
                dot={{ fill: "var(--color-cpuLoad)" }}
              />
              <Line
                type="monotone"
                dataKey="memoryLoad"
                stroke="var(--color-memoryLoad)"
                strokeWidth={2}
                dot={{ fill: "var(--color-memoryLoad)" }}
              />
              <Line
                type="monotone"
                dataKey="containers"
                stroke="var(--color-containers)"
                strokeWidth={2}
                dot={{ fill: "var(--color-containers)" }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Storage Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Analytics
          </CardTitle>
          <CardDescription>
            File storage growth and usage trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <AreaChart data={data.storageMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="storageUsed"
                stackId="1"
                stroke="var(--color-storageUsed)"
                fill="var(--color-storageUsed)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="totalFiles"
                stackId="2"
                stroke="var(--color-totalFiles)"
                fill="var(--color-totalFiles)"
                fillOpacity={0.4}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* AI Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Usage Trends
          </CardTitle>
          <CardDescription>
            AI requests, tokens, and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={data.aiUsageMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="requests" fill="var(--color-requests)" />
              <Bar dataKey="tokens" fill="var(--color-tokens)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* System Health Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>
            Overall system health and uptime monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <LineChart data={data.systemHealth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="health"
                stroke="var(--color-health)"
                strokeWidth={3}
                dot={{ fill: "var(--color-health)" }}
              />
              <Line
                type="monotone"
                dataKey="uptime"
                stroke="var(--color-uptime)"
                strokeWidth={2}
                dot={{ fill: "var(--color-uptime)" }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}