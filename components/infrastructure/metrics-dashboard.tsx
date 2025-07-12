"use client";

/**
 * Metrics Dashboard Component
 * Production-ready Prometheus metrics visualization dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Server,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Filter,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useMetrics } from '@/hooks/use-metrics';
import { formatBytes, formatNumber } from '@/lib/utils';

interface MetricsDashboardProps {
  className?: string;
}

export function MetricsDashboard({ className }: MetricsDashboardProps) {
  const [timeRange, setTimeRange] = useState('1h');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['cpu', 'memory', 'disk', 'network']);

  const {
    systemMetrics,
    containerMetrics,
    webvmMetrics,
    alerts,
    loading,
    error,
    refreshMetrics,
  } = useMetrics(timeRange, refreshInterval);

  const handleRefresh = useCallback(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  const timeRangeOptions = [
    { value: '5m', label: 'Last 5 minutes' },
    { value: '15m', label: 'Last 15 minutes' },
    { value: '1h', label: 'Last hour' },
    { value: '6h', label: 'Last 6 hours' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
  ];

  const refreshOptions = [
    { value: 5, label: '5 seconds' },
    { value: 10, label: '10 seconds' },
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Infrastructure Metrics</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and performance metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(Number(value))}>
            <SelectTrigger className="w-32">
              <RefreshCw className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {refreshOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                  <div>
                    <p className="font-medium">{alert.name}</p>
                    <p className="text-sm text-muted-foreground">{alert.annotations.description}</p>
                  </div>
                  <Badge variant="destructive">{alert.state}</Badge>
                </div>
              ))}
              {alerts.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{alerts.length - 3} more alerts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Usage"
          value={systemMetrics.cpu?.current || 0}
          unit="%"
          icon={Cpu}
          trend={systemMetrics.cpu?.trend}
          color="blue"
        />
        <MetricCard
          title="Memory Usage"
          value={systemMetrics.memory?.current || 0}
          unit="%"
          icon={MemoryStick}
          trend={systemMetrics.memory?.trend}
          color="green"
        />
        <MetricCard
          title="Disk Usage"
          value={systemMetrics.disk?.current || 0}
          unit="%"
          icon={HardDrive}
          trend={systemMetrics.disk?.trend}
          color="orange"
        />
        <MetricCard
          title="Network I/O"
          value={systemMetrics.network?.current || 0}
          unit="MB/s"
          icon={Network}
          trend={systemMetrics.network?.trend}
          color="purple"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">System Metrics</TabsTrigger>
          <TabsTrigger value="containers">Containers</TabsTrigger>
          <TabsTrigger value="webvm">WebVM Instances</TabsTrigger>
          <TabsTrigger value="custom">Custom Queries</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>CPU & Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={systemMetrics.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#10b981" name="Memory %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disk & Network I/O</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={systemMetrics.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="disk" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Disk %" />
                    <Area type="monotone" dataKey="network" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" name="Network MB/s" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resource Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">CPU Cores</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={systemMetrics.cpuCores}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#3b82f6"
                        dataKey="usage"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {systemMetrics.cpuCores?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Memory Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Used</span>
                      <span className="text-sm font-medium">{formatBytes(systemMetrics.memory?.used || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Available</span>
                      <span className="text-sm font-medium">{formatBytes(systemMetrics.memory?.available || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cached</span>
                      <span className="text-sm font-medium">{formatBytes(systemMetrics.memory?.cached || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Buffers</span>
                      <span className="text-sm font-medium">{formatBytes(systemMetrics.memory?.buffers || 0)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Disk Usage</h4>
                  <div className="space-y-2">
                    {systemMetrics.disks?.map((disk, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{disk.device}</span>
                          <span>{disk.usage}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${disk.usage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="containers" className="space-y-4">
          <ContainerMetrics metrics={containerMetrics} />
        </TabsContent>

        <TabsContent value="webvm" className="space-y-4">
          <WebVMMetrics metrics={webvmMetrics} />
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <CustomQueries />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'stable';
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function MetricCard({ title, value, unit, icon: Icon, trend, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100',
  };

  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">
                {formatNumber(value)}{unit}
              </p>
              {trendIcon && (
                <trendIcon className={`h-4 w-4 ${trendColor}`} />
              )}
            </div>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Container Metrics Component
interface ContainerMetricsProps {
  metrics: any[];
}

function ContainerMetrics({ metrics }: ContainerMetricsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Container Resource Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cpu" fill="#3b82f6" name="CPU %" />
              <Bar dataKey="memory" fill="#10b981" name="Memory %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top CPU Consumers</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {metrics
                  .sort((a, b) => b.cpu - a.cpu)
                  .slice(0, 10)
                  .map((container, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4" />
                        <span className="text-sm font-medium">{container.name}</span>
                      </div>
                      <Badge variant="secondary">{container.cpu.toFixed(1)}%</Badge>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Memory Consumers</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {metrics
                  .sort((a, b) => b.memory - a.memory)
                  .slice(0, 10)
                  .map((container, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4" />
                        <span className="text-sm font-medium">{container.name}</span>
                      </div>
                      <Badge variant="secondary">{formatBytes(container.memoryUsage)}</Badge>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// WebVM Metrics Component
interface WebVMMetricsProps {
  metrics: any[];
}

function WebVMMetrics({ metrics }: WebVMMetricsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Instances</p>
                <p className="text-2xl font-bold">{metrics.filter(m => m.status === 'running').length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Instances</p>
                <p className="text-2xl font-bold">{metrics.length}</p>
              </div>
              <Server className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg CPU Usage</p>
                <p className="text-2xl font-bold">
                  {metrics.length > 0
                    ? (metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <Cpu className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>WebVM Instance Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="instanceId" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#3b82f6" name="CPU %" />
              <Line type="monotone" dataKey="memory" stroke="#10b981" name="Memory %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Custom Queries Component
function CustomQueries() {
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState<any[]>([]);

  const executeQuery = async () => {
    try {
      const response = await fetch('/api/infrastructure/metrics/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setQueryResults(data.result || []);
    } catch (error) {
      console.error('Query execution failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Custom Prometheus Queries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter Prometheus query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button onClick={executeQuery}>Execute</Button>
          </div>

          {queryResults.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Query Results</h4>
              <ScrollArea className="h-64 border rounded-md p-4">
                <pre className="text-xs">
                  {JSON.stringify(queryResults, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
