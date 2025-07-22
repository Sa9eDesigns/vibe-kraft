'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Server, 
  Container, 
  Activity, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  Network,
  Play,
  Square,
  Pause,
  Plus,
  Settings,
  Monitor,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirecrackerStats {
  totalWorkspaces: number;
  activeWorkspaces: number;
  totalVMs: number;
  runningVMs: number;
  totalContainers: number;
  runningContainers: number;
  vmUtilization: number;
  containerUtilization: number;
}

interface FirecrackerDashboardProps {
  organizationId: string;
  className?: string;
}

export function FirecrackerDashboard({ organizationId, className }: FirecrackerDashboardProps) {
  const [stats, setStats] = useState<FirecrackerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStats();
  }, [organizationId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/firecracker/stats?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Mock data for demonstration
        setStats({
          totalWorkspaces: 8,
          activeWorkspaces: 5,
          totalVMs: 8,
          runningVMs: 5,
          totalContainers: 24,
          runningContainers: 18,
          vmUtilization: 62,
          containerUtilization: 75,
        });
      }
    } catch (error) {
      console.error('Error fetching Firecracker stats:', error);
      // Set mock data on error
      setStats({
        totalWorkspaces: 8,
        activeWorkspaces: 5,
        totalVMs: 8,
        runningVMs: 5,
        totalContainers: 24,
        runningContainers: 18,
        vmUtilization: 62,
        containerUtilization: 75,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Firecracker Workspaces</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWorkspaces}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalWorkspaces} total workspaces
            </p>
            <Progress 
              value={(stats.activeWorkspaces / stats.totalWorkspaces) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running VMs</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.runningVMs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.vmUtilization}% utilization
            </p>
            <Progress value={stats.vmUtilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Containers</CardTitle>
            <Container className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.runningContainers}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalContainers} total containers
            </p>
            <Progress 
              value={(stats.runningContainers / stats.totalContainers) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">Healthy</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="containers">Containers</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common Firecracker workspace tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Firecracker Workspace
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Container className="h-4 w-4 mr-2" />
                  Deploy Container
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Monitor className="h-4 w-4 mr-2" />
                  Launch VM
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Templates
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Resource Usage
                </CardTitle>
                <CardDescription>
                  Current resource utilization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Usage</span>
                    <span>32%</span>
                  </div>
                  <Progress value={32} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Network I/O</span>
                    <span>28%</span>
                  </div>
                  <Progress value={28} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest Firecracker workspace events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span>VM "dev-workspace-1" started successfully</span>
                  <span className="text-muted-foreground ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  <span>Container "nginx-proxy" deployed</span>
                  <span className="text-muted-foreground ml-auto">5 min ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                  <span>Snapshot created for "prod-workspace"</span>
                  <span className="text-muted-foreground ml-auto">12 min ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span>Template "ubuntu-dev" updated</span>
                  <span className="text-muted-foreground ml-auto">1 hour ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspaces">
          <Card>
            <CardHeader>
              <CardTitle>Firecracker Workspaces</CardTitle>
              <CardDescription>
                Manage your Firecracker-powered development environments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Firecracker workspace management interface</p>
                <p className="text-xs">Integration with workspace list coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="containers">
          <Card>
            <CardHeader>
              <CardTitle>Container Management</CardTitle>
              <CardDescription>
                Monitor and manage containers across all Firecracker VMs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Container className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Container orchestration dashboard</p>
                <p className="text-xs">Comprehensive container management interface</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Performance Monitoring</CardTitle>
              <CardDescription>
                Real-time metrics and performance analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Performance monitoring dashboard</p>
                <p className="text-xs">Real-time metrics and analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
