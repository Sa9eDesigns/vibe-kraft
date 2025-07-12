/**
 * Firecracker Workspace Dashboard
 * Main dashboard for managing Firecracker workspace instances
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Server,
  Play,
  Square,
  RotateCcw,
  Trash2,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Terminal,
  Code,
  Settings,
  Activity,
  Zap
} from 'lucide-react';
import { useFirecracker } from '@/hooks/use-firecracker';
import { WorkspaceLauncher } from './workspace-launcher';
import { WorkspaceMetrics } from './workspace-metrics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface WorkspaceDashboardProps {
  userId: string;
  className?: string;
}

const statusConfig = {
  creating: { label: 'Creating', variant: 'secondary' as const, icon: Loader2, color: 'text-blue-500' },
  running: { label: 'Running', variant: 'default' as const, icon: Play, color: 'text-green-500' },
  stopped: { label: 'Stopped', variant: 'outline' as const, icon: Square, color: 'text-gray-500' },
  error: { label: 'Error', variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-500' },
  deleting: { label: 'Deleting', variant: 'secondary' as const, icon: Loader2, color: 'text-orange-500' },
  unknown: { label: 'Unknown', variant: 'outline' as const, icon: AlertCircle, color: 'text-gray-500' },
};

export function WorkspaceDashboard({ userId, className }: WorkspaceDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [showLauncher, setShowLauncher] = useState(false);
  const [deleteInstanceId, setDeleteInstanceId] = useState<string | null>(null);

  const {
    instances,
    isLoading,
    errors,
    startInstance,
    stopInstance,
    restartInstance,
    deleteInstance,
    refreshAll,
  } = useFirecracker({ userId });

  const filteredInstances = instances?.filter(instance =>
    instance.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instance.id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleInstanceAction = useCallback(async (
    instanceId: string,
    action: 'start' | 'stop' | 'restart'
  ) => {
    try {
      switch (action) {
        case 'start':
          await startInstance(instanceId);
          toast.success('Instance started successfully');
          break;
        case 'stop':
          await stopInstance(instanceId);
          toast.success('Instance stopped successfully');
          break;
        case 'restart':
          await restartInstance(instanceId);
          toast.success('Instance restarted successfully');
          break;
      }
      refreshAll();
    } catch (error) {
      toast.error(`Failed to ${action} instance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [startInstance, stopInstance, restartInstance, refreshAll]);

  const handleDeleteInstance = useCallback(async (instanceId: string) => {
    try {
      await deleteInstance(instanceId);
      toast.success('Instance deleted successfully');
      setDeleteInstanceId(null);
      refreshAll();
    } catch (error) {
      toast.error(`Failed to delete instance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [deleteInstance, refreshAll]);

  const getResourceUsage = (instance: any) => {
    // Mock resource usage - in real implementation, this would come from metrics
    return {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
    };
  };

  if (showLauncher) {
    return (
      <div className={className}>
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setShowLauncher(false)}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <WorkspaceLauncher
          userId={userId}
          onLaunch={(instanceId) => {
            setShowLauncher(false);
            setSelectedInstance(instanceId);
            refreshAll();
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Firecracker Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your high-performance microVM workspaces
          </p>
        </div>
        <Button onClick={() => setShowLauncher(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Workspace
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Workspaces</p>
                <p className="text-2xl font-bold">{instances?.length || 0}</p>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Running</p>
                <p className="text-2xl font-bold text-green-600">
                  {instances?.filter(i => i.status === 'running').length || 0}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stopped</p>
                <p className="text-2xl font-bold text-gray-600">
                  {instances?.filter(i => i.status === 'stopped').length || 0}
                </p>
              </div>
              <Square className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">
                  {instances?.filter(i => i.status === 'error').length || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline" size="sm" onClick={refreshAll}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Instances List */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-4" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredInstances.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Workspaces Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No workspaces match your search.' : 'Get started by creating your first workspace.'}
                </p>
                <Button onClick={() => setShowLauncher(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workspace
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInstances.map((instance) => {
                const status = statusConfig[instance.status] || statusConfig.unknown;
                const StatusIcon = status.icon;
                const usage = getResourceUsage(instance);

                return (
                  <Card key={instance.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={cn('h-4 w-4', status.color)} />
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => window.open(`/workspace/${instance.id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Workspace
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(instance.connectionUrl, '_blank')}
                            >
                              <Terminal className="h-4 w-4 mr-2" />
                              SSH Access
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {instance.status === 'stopped' && (
                              <DropdownMenuItem
                                onClick={() => handleInstanceAction(instance.id, 'start')}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start
                              </DropdownMenuItem>
                            )}
                            {instance.status === 'running' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleInstanceAction(instance.id, 'stop')}
                                >
                                  <Square className="h-4 w-4 mr-2" />
                                  Stop
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleInstanceAction(instance.id, 'restart')}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Restart
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteInstanceId(instance.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{instance.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {instance.image} • {instance.memory} • {instance.cpuCount} CPU
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Resource Usage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Cpu className="h-3 w-3" />
                            CPU
                          </span>
                          <span>{usage.cpu}%</span>
                        </div>
                        <Progress value={usage.cpu} className="h-1" />

                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <MemoryStick className="h-3 w-3" />
                            Memory
                          </span>
                          <span>{usage.memory}%</span>
                        </div>
                        <Progress value={usage.memory} className="h-1" />

                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            Disk
                          </span>
                          <span>{usage.disk}%</span>
                        </div>
                        <Progress value={usage.disk} className="h-1" />
                      </div>

                      {/* Instance Info */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created {formatDistanceToNow(new Date(instance.createdAt))} ago
                        </div>
                        <div className="flex items-center gap-1">
                          <Network className="h-3 w-3" />
                          {instance.networkConfig.ipAddress}
                        </div>
                        {instance.vnc && (
                          <div className="flex items-center gap-1">
                            <Monitor className="h-3 w-3" />
                            VNC: {instance.vncPort}
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open(`/workspace/${instance.id}`, '_blank')}
                        >
                          <Code className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                        {instance.status === 'running' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInstanceAction(instance.id, 'stop')}
                          >
                            <Square className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInstanceAction(instance.id, 'start')}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {/* List view implementation would go here */}
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">List view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <WorkspaceMetrics userId={userId} instances={instances} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteInstanceId} onOpenChange={() => setDeleteInstanceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workspace? This action cannot be undone.
              All data in the workspace will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInstanceId && handleDeleteInstance(deleteInstanceId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
