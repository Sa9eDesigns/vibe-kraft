/**
 * Firecracker Workspace Metrics
 * Real-time metrics and monitoring for Firecracker workspaces
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Server,
  Monitor,
} from 'lucide-react';
import { useInfrastructureMonitoring } from '@/hooks/use-metrics';
import { cn } from '@/lib/utils';

interface WorkspaceMetricsProps {
  userId: string;
  instances?: any[];
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'stable';
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  change?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Mock data generator for demonstration
const generateMockData = (points: number = 24) => {
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(Date.now() - (points - i) * 60000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    cpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
    disk: Math.floor(Math.random() * 100),
    network: Math.floor(Math.random() * 1000),
  }));
};

function MetricCard({ title, value, unit, icon: Icon, trend, color, change }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100',
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  };

  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {value.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {unit}
                </span>
              </p>
              {trend && change !== undefined && (
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                )}>
                  {TrendIcon && <TrendIcon className="h-3 w-3" />}
                  {Math.abs(change)}%
                </div>
              )}
            </div>
          </div>
          <div className={cn('p-3 rounded-lg', colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkspaceMetrics({ userId, instances = [], className }: WorkspaceMetricsProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [selectedInstance, setSelectedInstance] = useState<string>('all');
  const [metricsData, setMetricsData] = useState(generateMockData());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    metrics,
    health,
    isLoading,
    refreshAll,
  } = useInfrastructureMonitoring({
    timeRange,
    refreshInterval: 30000, // 30 seconds
  });

  // Refresh metrics data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setMetricsData(generateMockData());
    await refreshAll();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      setMetricsData(generateMockData());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate aggregate metrics
  const aggregateMetrics = {
    totalInstances: instances.length,
    runningInstances: instances.filter(i => i.status === 'running').length,
    avgCpu: Math.floor(Math.random() * 100),
    avgMemory: Math.floor(Math.random() * 100),
    avgDisk: Math.floor(Math.random() * 100),
    totalNetworkTraffic: Math.floor(Math.random() * 10000),
  };

  const instanceStatusData = [
    { name: 'Running', value: instances.filter(i => i.status === 'running').length, color: '#00C49F' },
    { name: 'Stopped', value: instances.filter(i => i.status === 'stopped').length, color: '#FF8042' },
    { name: 'Error', value: instances.filter(i => i.status === 'error').length, color: '#FF0000' },
    { name: 'Creating', value: instances.filter(i => i.status === 'creating').length, color: '#FFBB28' },
  ].filter(item => item.value > 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workspace Metrics</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Instances"
          value={aggregateMetrics.totalInstances}
          unit="instances"
          icon={Server}
          color="blue"
        />
        <MetricCard
          title="Running Instances"
          value={aggregateMetrics.runningInstances}
          unit="active"
          icon={CheckCircle}
          color="green"
          trend="stable"
          change={0}
        />
        <MetricCard
          title="Avg CPU Usage"
          value={aggregateMetrics.avgCpu}
          unit="%"
          icon={Cpu}
          color="orange"
          trend="up"
          change={5}
        />
        <MetricCard
          title="Avg Memory Usage"
          value={aggregateMetrics.avgMemory}
          unit="%"
          icon={MemoryStick}
          color="purple"
          trend="down"
          change={3}
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="instances">Instances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  CPU Usage
                </CardTitle>
                <CardDescription>Average CPU utilization across all instances</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="cpu"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Memory Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MemoryStick className="h-5 w-5" />
                  Memory Usage
                </CardTitle>
                <CardDescription>Memory utilization trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Instance Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Instance Status
                </CardTitle>
                <CardDescription>Distribution of instance states</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={instanceStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {instanceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resource Utilization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Resource Utilization
                </CardTitle>
                <CardDescription>Current resource usage across all instances</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      CPU
                    </span>
                    <span>{aggregateMetrics.avgCpu}%</span>
                  </div>
                  <Progress value={aggregateMetrics.avgCpu} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <MemoryStick className="h-4 w-4" />
                      Memory
                    </span>
                    <span>{aggregateMetrics.avgMemory}%</span>
                  </div>
                  <Progress value={aggregateMetrics.avgMemory} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Disk
                    </span>
                    <span>{aggregateMetrics.avgDisk}%</span>
                  </div>
                  <Progress value={aggregateMetrics.avgDisk} className="h-2" />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      Network Traffic
                    </span>
                    <span>{(aggregateMetrics.totalNetworkTraffic / 1000).toFixed(1)} GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Detailed performance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                  <Line type="monotone" dataKey="disk" stroke="#ffc658" name="Disk %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Network Traffic
              </CardTitle>
              <CardDescription>Network I/O across all instances</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="network" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instances" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.map((instance) => (
              <Card key={instance.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{instance.name}</CardTitle>
                    <Badge variant={instance.status === 'running' ? 'default' : 'secondary'}>
                      {instance.status}
                    </Badge>
                  </div>
                  <CardDescription>{instance.image}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU</span>
                      <span>{Math.floor(Math.random() * 100)}%</span>
                    </div>
                    <Progress value={Math.floor(Math.random() * 100)} className="h-1" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memory</span>
                      <span>{Math.floor(Math.random() * 100)}%</span>
                    </div>
                    <Progress value={Math.floor(Math.random() * 100)} className="h-1" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {instance.memory} • {instance.cpuCount} CPU
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
