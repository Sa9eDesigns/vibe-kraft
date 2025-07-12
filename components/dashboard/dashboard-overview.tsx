"use client";

import { useState } from "react";
import {
  Package,
  Monitor,
  Server,
  Activity,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Bot,
  Container,
  HardDrive,
  Cpu,
  MemoryStick,
  Database,
  Shield,
  Zap,
  FileText,
  Code,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  Square
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { ProjectsList } from "./projects/projects-list";
import { WorkspacesList } from "./workspaces/workspaces-list";
import { WebVMInstancesList } from "./webvm/webvm-instances-list";
import { CreateProjectDialog } from "./projects/create-project-dialog";
import { CreateWorkspaceDialog } from "./workspaces/create-workspace-dialog";
import { CreateWebVMDialog } from "./webvm/create-webvm-dialog";
import { DashboardFilters, FilterState } from "./management/dashboard-filters";

interface DashboardOverviewProps {
  organizationId: string;
}

export function DashboardOverview({ organizationId }: DashboardOverviewProps) {
  const { stats, overview, isLoading, isError } = useDashboardStats(organizationId);
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "",
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-destructive">Error loading dashboard</h3>
          <p className="text-sm text-muted-foreground mt-2">Failed to fetch dashboard statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Development Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {overview.completionRate}% completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.activeWorkspaces}</div>
            <p className="text-xs text-muted-foreground">
              of {overview.totalWorkspaces} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WebVM Instances</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.runningInstances}</div>
            <p className="text-xs text-muted-foreground">
              {overview.instanceUtilization}% utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2K</div>
            <p className="text-xs text-muted-foreground">
              +25% this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6.2GB</div>
            <p className="text-xs text-muted-foreground">
              62% of quota
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common development tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Launch WebVM Workspace</span>
              <Play className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Create New Project</span>
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">AI Code Assistant</span>
              <Bot className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">File Browser</span>
              <FileText className="h-4 w-4 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Infrastructure health overview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">WebVM Service</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Container Runtime</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">AI Services</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage Backend</span>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Real-time system performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>CPU Usage</span>
                <span>45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Memory Usage</span>
                <span>68%</span>
              </div>
              <Progress value={68} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Network I/O</span>
                <span>32%</span>
              </div>
              <Progress value={32} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Progress</CardTitle>
            <CardDescription>Overall completion across all projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion Rate</span>
                <span>{overview.completionRate}%</span>
              </div>
              <Progress value={overview.completionRate} className="h-2" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{overview.completedTasks} completed</span>
              <span>{overview.totalTasks - overview.completedTasks} remaining</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instance Utilization</CardTitle>
            <CardDescription>WebVM instances currently running</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilization Rate</span>
                <span>{overview.instanceUtilization}%</span>
              </div>
              <Progress value={overview.instanceUtilization} className="h-2" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{overview.runningInstances} running</span>
              <span>{overview.totalInstances - overview.runningInstances} stopped</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
              <TabsTrigger value="instances">WebVM</TabsTrigger>
              <TabsTrigger value="ai">AI Tools</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              {activeTab === "projects" && (
                <CreateProjectDialog organizationId={organizationId} />
              )}
              {activeTab === "workspaces" && (
                <CreateWorkspaceDialog organizationId={organizationId} />
              )}
              {activeTab === "instances" && (
                <CreateWebVMDialog organizationId={organizationId} />
              )}
            </div>
          </div>

          {activeTab !== "overview" && (
            <DashboardFilters
              activeTab={activeTab}
              onFiltersChange={handleFiltersChange}
            />
          )}
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Project</Badge>
                    <span className="text-muted-foreground">New project created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Workspace</Badge>
                    <span className="text-muted-foreground">Workspace activated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Instance</Badge>
                    <span className="text-muted-foreground">Instance started</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Workspaces</span>
                    <span>{overview.totalWorkspaces}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Instances</span>
                    <span>{overview.totalInstances}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Projects</span>
                    <span>{overview.totalProjects}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Projects</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Workspaces</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Instances</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <ProjectsList organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="workspaces">
          <WorkspacesList
            organizationId={organizationId}
            query={{
              search: filters.search,
              status: filters.status as any,
              sortBy: filters.sortBy as any,
              sortOrder: filters.sortOrder,
              page: 1,
              limit: 20,
            }}
          />
        </TabsContent>

        <TabsContent value="instances">
          <WebVMInstancesList
            organizationId={organizationId}
            query={{
              search: filters.search,
              status: filters.status as any,
              sortBy: filters.sortBy as any,
              sortOrder: filters.sortOrder,
              page: 1,
              limit: 20,
            }}
          />
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  AI-powered development tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Code Generation</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Code Review</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Debugging Assistant</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Documentation</span>
                  <Badge variant="secondary">Available</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage Statistics
                </CardTitle>
                <CardDescription>
                  AI service usage metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Requests Today</span>
                  <span>1,247</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tokens Used</span>
                  <span>45.6K</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Response Time</span>
                  <span>0.8s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Success Rate</span>
                  <span>99.2%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  AI Models
                </CardTitle>
                <CardDescription>
                  Available AI models and configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">GPT-4o</span>
                  <Badge variant="default">Primary</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Claude 3.5 Sonnet</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Gemini 1.5 Pro</span>
                  <Badge variant="secondary">Available</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage Overview
                </CardTitle>
                <CardDescription>
                  File storage and usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Used Storage</span>
                    <span>6.2GB / 10GB</span>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Files</span>
                  <span>2,650</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Workspaces</span>
                  <span>{overview.totalWorkspaces}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  File Types
                </CardTitle>
                <CardDescription>
                  Distribution of file types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Source Code</span>
                  <span>45%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Documentation</span>
                  <span>25%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Assets</span>
                  <span>20%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Other</span>
                  <span>10%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Storage Buckets
                </CardTitle>
                <CardDescription>
                  MinIO storage bucket status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">workspace-files</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">project-assets</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">backup-storage</span>
                  <Badge variant="secondary">Standby</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>
                  Overall system status and health
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Health</span>
                  <Badge variant="default">98%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uptime</span>
                  <Badge variant="default">99.9%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Alerts</span>
                  <Badge variant="destructive">2</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Container className="h-5 w-5" />
                  Container Status
                </CardTitle>
                <CardDescription>
                  Docker container health
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Running Containers</span>
                  <span>8/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">CPU Usage</span>
                  <span>45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memory Usage</span>
                  <span>68%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Real-time performance data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Response Time</span>
                    <span>120ms</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Throughput</span>
                    <span>850 req/min</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
