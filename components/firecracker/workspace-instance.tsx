/**
 * Firecracker Workspace Instance Viewer
 * Detailed view and management for individual Firecracker instances
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Play,
  Square,
  RotateCcw,
  Trash2,
  Terminal,
  Monitor,
  Settings,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Clock,
  ExternalLink,
  Copy,
  Download,
  Upload,
  Camera,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Code,
  FileText,
  Zap,
  Shield,
  Globe,
} from 'lucide-react';
import { useFirecracker } from '@/hooks/use-firecracker';
import { WorkspaceTerminal } from './workspace-terminal';
import { WorkspaceSnapshots } from './workspace-snapshots';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface WorkspaceInstanceProps {
  instanceId: string;
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

export function WorkspaceInstance({ instanceId, className }: WorkspaceInstanceProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const {
    instance,
    isLoading,
    startInstance,
    stopInstance,
    restartInstance,
    deleteInstance,
    executeCommand,
    refreshAll,
  } = useFirecracker({ instanceId });

  // Mock resource usage - in real implementation, this would come from metrics
  const resourceUsage = {
    cpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
    disk: Math.floor(Math.random() * 100),
    network: {
      in: Math.floor(Math.random() * 1000),
      out: Math.floor(Math.random() * 1000),
    },
  };

  const handleInstanceAction = useCallback(async (action: 'start' | 'stop' | 'restart') => {
    setIsPerformingAction(true);
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
    } finally {
      setIsPerformingAction(false);
    }
  }, [instanceId, startInstance, stopInstance, restartInstance, refreshAll]);

  const handleDeleteInstance = useCallback(async () => {
    try {
      await deleteInstance(instanceId);
      toast.success('Instance deleted successfully');
      // Redirect to dashboard or parent component
      window.history.back();
    } catch (error) {
      toast.error(`Failed to delete instance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [instanceId, deleteInstance]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, []);

  // Mock logs - in real implementation, this would come from the logs API
  useEffect(() => {
    const mockLogs = [
      '[2024-01-15 10:30:15] Instance starting...',
      '[2024-01-15 10:30:16] Firecracker microVM initialized',
      '[2024-01-15 10:30:17] Network interface configured: 192.168.1.100',
      '[2024-01-15 10:30:18] SSH server started on port 22',
      '[2024-01-15 10:30:19] Instance ready for connections',
      '[2024-01-15 10:30:20] VNC server started on port 5900',
    ];
    setLogs(mockLogs);
  }, []);

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Instance Not Found</h3>
            <p className="text-muted-foreground">
              The requested workspace instance could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[instance.status] || statusConfig.unknown;
  const StatusIcon = status.icon;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{instance.name}</h1>
            <div className="flex items-center gap-2">
              <StatusIcon className={cn('h-5 w-5', status.color)} />
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            {instance.image} • Created {formatDistanceToNow(new Date(instance.createdAt))} ago
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {instance.status === 'stopped' && (
            <Button 
              onClick={() => handleInstanceAction('start')}
              disabled={isPerformingAction}
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
          
          {instance.status === 'running' && (
            <>
              <Button 
                variant="outline"
                onClick={() => handleInstanceAction('restart')}
                disabled={isPerformingAction}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleInstanceAction('stop')}
                disabled={isPerformingAction}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}

          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPerformingAction}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CPU Usage</p>
                <p className="text-2xl font-bold">{resourceUsage.cpu}%</p>
              </div>
              <Cpu className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={resourceUsage.cpu} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Memory</p>
                <p className="text-2xl font-bold">{resourceUsage.memory}%</p>
              </div>
              <MemoryStick className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={resourceUsage.memory} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disk Usage</p>
                <p className="text-2xl font-bold">{resourceUsage.disk}%</p>
              </div>
              <HardDrive className="h-8 w-8 text-orange-500" />
            </div>
            <Progress value={resourceUsage.disk} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Network I/O</p>
                <p className="text-lg font-bold">
                  {resourceUsage.network.in}↓ {resourceUsage.network.out}↑
                </p>
                <p className="text-xs text-muted-foreground">MB/s</p>
              </div>
              <Network className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Instance Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Instance Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Instance ID</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">{instance.id}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(instance.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Image</p>
                    <p>{instance.image}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Memory</p>
                    <p>{instance.memory}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">CPU Cores</p>
                    <p>{instance.cpuCount}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Disk Size</p>
                    <p>{instance.diskSize}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Created</p>
                    <p>{format(new Date(instance.createdAt), 'PPp')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Network Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-muted-foreground">IP Address</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {instance.networkConfig.ipAddress}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(instance.networkConfig.ipAddress)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-muted-foreground">SSH Port</span>
                    <span>{instance.sshPort}</span>
                  </div>
                  {instance.vnc && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-muted-foreground">VNC Port</span>
                      <span>{instance.vncPort}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-muted-foreground">Gateway</span>
                    <span>{instance.networkConfig.gateway}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-muted-foreground">Subnet</span>
                    <span>{instance.networkConfig.subnet}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Quick Access</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(instance.connectionUrl, '_blank')}
                      disabled={instance.status !== 'running'}
                    >
                      <Terminal className="h-4 w-4 mr-2" />
                      SSH
                    </Button>
                    {instance.vnc && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/vnc/${instance.id}`, '_blank')}
                        disabled={instance.status !== 'running'}
                      >
                        <Monitor className="h-4 w-4 mr-2" />
                        VNC
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/workspace/${instance.id}`, '_blank')}
                      disabled={instance.status !== 'running'}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      IDE
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Real-time resource utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm text-muted-foreground">{resourceUsage.cpu}%</span>
                  </div>
                  <Progress value={resourceUsage.cpu} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-muted-foreground">{resourceUsage.memory}%</span>
                  </div>
                  <Progress value={resourceUsage.memory} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disk Usage</span>
                    <span className="text-sm text-muted-foreground">{resourceUsage.disk}%</span>
                  </div>
                  <Progress value={resourceUsage.disk} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terminal" className="space-y-6">
          <WorkspaceTerminal instanceId={instanceId} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Instance Logs
              </CardTitle>
              <CardDescription>Real-time logs from the Firecracker instance</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded border bg-muted/50 p-4">
                <div className="space-y-1 font-mono text-sm">
                  {logs.map((log, index) => (
                    <div key={index} className="text-muted-foreground">
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snapshots" className="space-y-6">
          <WorkspaceSnapshots instanceId={instanceId} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Instance Settings
              </CardTitle>
              <CardDescription>Configure instance parameters and behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Instance settings modification is coming soon. Currently, you can only view the configuration.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace Instance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{instance.name}"? This action cannot be undone.
              All data in the instance will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInstance}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Instance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
