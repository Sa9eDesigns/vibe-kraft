"use client";

/**
 * Container Manager Component
 * Production-ready Docker container management interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Terminal,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Eye,
  Download,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

import { Container, ContainerStats } from '@/lib/infrastructure/types';
import { useContainerOperations } from '@/hooks/use-container-operations';
import { formatBytes, formatDate, formatUptime } from '@/lib/utils';

interface ContainerManagerProps {
  className?: string;
}

export function ContainerManager({ className }: ContainerManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContainers, setSelectedContainers] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  const {
    containers,
    containerStats,
    loading,
    error,
    refreshContainers,
    startContainer,
    stopContainer,
    restartContainer,
    deleteContainer,
    createContainer,
    getContainerStats,
    getContainerLogs,
  } = useContainerOperations();

  useEffect(() => {
    refreshContainers();
  }, [refreshContainers]);

  const handleContainerSelect = useCallback((containerId: string) => {
    const newSelected = new Set(selectedContainers);
    if (newSelected.has(containerId)) {
      newSelected.delete(containerId);
    } else {
      newSelected.add(containerId);
    }
    setSelectedContainers(newSelected);
  }, [selectedContainers]);

  const handleBulkAction = useCallback(async (action: 'start' | 'stop' | 'restart' | 'delete') => {
    const containerIds = Array.from(selectedContainers);
    
    for (const containerId of containerIds) {
      try {
        switch (action) {
          case 'start':
            await startContainer(containerId);
            break;
          case 'stop':
            await stopContainer(containerId);
            break;
          case 'restart':
            await restartContainer(containerId);
            break;
          case 'delete':
            await deleteContainer(containerId);
            break;
        }
      } catch (error) {
        toast.error(`Failed to ${action} container ${containerId}`);
      }
    }
    
    setSelectedContainers(new Set());
    refreshContainers();
  }, [selectedContainers, startContainer, stopContainer, restartContainer, deleteContainer, refreshContainers]);

  const handleViewStats = useCallback(async (container: Container) => {
    setSelectedContainer(container);
    await getContainerStats(container.id);
    setShowStatsDialog(true);
  }, [getContainerStats]);

  const filteredContainers = containers.filter(container => {
    const matchesSearch = container.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         container.image.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || container.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = containers.reduce((acc, container) => {
    acc[container.status] = (acc[container.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Container Management</h2>
          <p className="text-muted-foreground">
            Manage Docker containers and monitor their performance
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={refreshContainers} disabled={loading}>
            <Activity className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Container
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Containers</p>
                <p className="text-2xl font-bold">{containers.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Running</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.running || 0}</p>
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
                <p className="text-2xl font-bold text-red-600">{statusCounts.stopped || 0}</p>
              </div>
              <Square className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error</p>
                <p className="text-2xl font-bold text-orange-600">{statusCounts.error || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search containers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="stopped">Stopped</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="creating">Creating</SelectItem>
          </SelectContent>
        </Select>

        {selectedContainers.size > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{selectedContainers.size} selected</Badge>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('start')}>
              <Play className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('stop')}>
              <Square className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('restart')}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Containers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Containers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedContainers.size === filteredContainers.length && filteredContainers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContainers(new Set(filteredContainers.map(c => c.id)));
                      } else {
                        setSelectedContainers(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ports</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContainers.map((container) => (
                <TableRow key={container.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedContainers.has(container.id)}
                      onChange={() => handleContainerSelect(container.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{container.name}</TableCell>
                  <TableCell>{container.image}</TableCell>
                  <TableCell>
                    <ContainerStatusBadge status={container.status} />
                  </TableCell>
                  <TableCell>
                    {container.ports.map((port, index) => (
                      <Badge key={index} variant="outline" className="mr-1">
                        {port.hostPort ? `${port.hostPort}:` : ''}{port.containerPort}/{port.protocol}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>{formatDate(container.createdAt)}</TableCell>
                  <TableCell>
                    <ContainerActions
                      container={container}
                      onStart={() => startContainer(container.id)}
                      onStop={() => stopContainer(container.id)}
                      onRestart={() => restartContainer(container.id)}
                      onDelete={() => deleteContainer(container.id)}
                      onViewStats={() => handleViewStats(container)}
                      onViewLogs={() => getContainerLogs(container.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Container Dialog */}
      <CreateContainerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateContainer={createContainer}
      />

      {/* Container Stats Dialog */}
      <ContainerStatsDialog
        open={showStatsDialog}
        onOpenChange={setShowStatsDialog}
        container={selectedContainer}
        stats={containerStats}
      />
    </div>
  );
}

// Container Status Badge Component
interface ContainerStatusBadgeProps {
  status: Container['status'];
}

function ContainerStatusBadge({ status }: ContainerStatusBadgeProps) {
  const statusConfig = {
    running: { variant: 'default' as const, color: 'bg-green-500' },
    stopped: { variant: 'secondary' as const, color: 'bg-gray-500' },
    error: { variant: 'destructive' as const, color: 'bg-red-500' },
    creating: { variant: 'outline' as const, color: 'bg-blue-500' },
    deleting: { variant: 'outline' as const, color: 'bg-orange-500' },
    unknown: { variant: 'outline' as const, color: 'bg-gray-500' },
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <Badge variant={config.variant}>{status}</Badge>
    </div>
  );
}

// Container Actions Component
interface ContainerActionsProps {
  container: Container;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onDelete: () => void;
  onViewStats: () => void;
  onViewLogs: () => void;
}

function ContainerActions({
  container,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onViewStats,
  onViewLogs,
}: ContainerActionsProps) {
  const isRunning = container.status === 'running';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!isRunning && (
          <DropdownMenuItem onClick={onStart}>
            <Play className="h-4 w-4 mr-2" />
            Start
          </DropdownMenuItem>
        )}
        {isRunning && (
          <DropdownMenuItem onClick={onStop}>
            <Square className="h-4 w-4 mr-2" />
            Stop
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onRestart}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Restart
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onViewStats}>
          <Activity className="h-4 w-4 mr-2" />
          View Stats
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewLogs}>
          <Terminal className="h-4 w-4 mr-2" />
          View Logs
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Create Container Dialog Component
interface CreateContainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateContainer: (config: any) => Promise<void>;
}

function CreateContainerDialog({ open, onOpenChange, onCreateContainer }: CreateContainerDialogProps) {
  const [config, setConfig] = useState({
    name: '',
    image: '',
    command: '',
    environment: '',
    ports: '',
    volumes: '',
  });

  const handleCreate = async () => {
    try {
      const containerConfig = {
        name: config.name,
        image: config.image,
        command: config.command ? config.command.split(' ') : undefined,
        environment: config.environment ?
          Object.fromEntries(config.environment.split('\n').map(line => line.split('='))) : {},
        ports: config.ports ?
          config.ports.split(',').map(port => {
            const [containerPort, hostPort] = port.split(':');
            return {
              containerPort: parseInt(containerPort),
              hostPort: hostPort ? parseInt(hostPort) : undefined,
              protocol: 'tcp' as const,
            };
          }) : [],
        volumes: config.volumes ?
          config.volumes.split('\n').map(volume => {
            const [hostPath, containerPath] = volume.split(':');
            return {
              hostPath,
              containerPath,
              readOnly: false,
            };
          }) : [],
      };

      await onCreateContainer(containerConfig);
      onOpenChange(false);
      setConfig({
        name: '',
        image: '',
        command: '',
        environment: '',
        ports: '',
        volumes: '',
      });
      toast.success('Container created successfully');
    } catch (error) {
      toast.error('Failed to create container');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Container</DialogTitle>
          <DialogDescription>
            Configure and create a new Docker container.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Container Name</label>
            <Input
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="my-container"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Image</label>
            <Input
              value={config.image}
              onChange={(e) => setConfig({ ...config, image: e.target.value })}
              placeholder="nginx:latest"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Command (optional)</label>
            <Input
              value={config.command}
              onChange={(e) => setConfig({ ...config, command: e.target.value })}
              placeholder="/bin/bash"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Environment Variables (optional)</label>
            <textarea
              className="w-full p-2 border rounded-md"
              rows={3}
              value={config.environment}
              onChange={(e) => setConfig({ ...config, environment: e.target.value })}
              placeholder="KEY1=value1&#10;KEY2=value2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Ports (optional)</label>
            <Input
              value={config.ports}
              onChange={(e) => setConfig({ ...config, ports: e.target.value })}
              placeholder="80:8080,443:8443"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Volumes (optional)</label>
            <textarea
              className="w-full p-2 border rounded-md"
              rows={3}
              value={config.volumes}
              onChange={(e) => setConfig({ ...config, volumes: e.target.value })}
              placeholder="/host/path:/container/path&#10;/another/host/path:/another/container/path"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!config.name || !config.image}>
            Create Container
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Container Stats Dialog Component
interface ContainerStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: Container | null;
  stats: ContainerStats | null;
}

function ContainerStatsDialog({ open, onOpenChange, container, stats }: ContainerStatsDialogProps) {
  if (!container || !stats) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Container Statistics - {container.name}</DialogTitle>
          <DialogDescription>
            Real-time performance metrics for the container.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CPU Usage</p>
                  <p className="text-2xl font-bold">{stats.cpuPercent.toFixed(1)}%</p>
                </div>
                <Cpu className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Memory Usage</p>
                  <p className="text-2xl font-bold">{formatBytes(stats.memoryUsage)}</p>
                  <p className="text-xs text-muted-foreground">
                    of {formatBytes(stats.memoryLimit)}
                  </p>
                </div>
                <MemoryStick className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Network RX</p>
                  <p className="text-2xl font-bold">{formatBytes(stats.networkRx)}</p>
                </div>
                <Network className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Network TX</p>
                  <p className="text-2xl font-bold">{formatBytes(stats.networkTx)}</p>
                </div>
                <Network className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Memory Usage</h4>
            <Progress value={(stats.memoryUsage / stats.memoryLimit) * 100} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatBytes(stats.memoryUsage)}</span>
              <span>{formatBytes(stats.memoryLimit)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Block Read:</span>
              <span className="ml-2">{formatBytes(stats.blockRead)}</span>
            </div>
            <div>
              <span className="font-medium">Block Write:</span>
              <span className="ml-2">{formatBytes(stats.blockWrite)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
