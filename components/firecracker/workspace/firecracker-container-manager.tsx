'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Container, 
  Plus, 
  MoreHorizontal, 
  Play, 
  Square, 
  Pause, 
  Trash2,
  RefreshCw,
  Terminal,
  Settings,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FirecrackerWorkspace } from '@/lib/types/firecracker';

interface ContainerStatus {
  id: string;
  name: string;
  image: string;
  status: 'CREATING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'DELETING' | 'PAUSED';
  state: {
    running: boolean;
    paused: boolean;
    restarting: boolean;
    oom_killed: boolean;
    dead: boolean;
    pid: number;
    exit_code: number;
    error: string;
    started_at: Date;
    finished_at?: Date;
  };
}

interface FirecrackerContainerManagerProps {
  workspace: FirecrackerWorkspace;
  className?: string;
  onContainerSelect?: (containerId: string) => void;
}

export function FirecrackerContainerManager({ 
  workspace, 
  className,
  onContainerSelect
}: FirecrackerContainerManagerProps) {
  const [containers, setContainers] = useState<ContainerStatus[]>(workspace.containers || []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);

  useEffect(() => {
    setContainers(workspace.containers || []);
  }, [workspace.containers]);

  const refreshContainers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/firecracker/workspaces/${workspace.id}/containers`);
      if (response.ok) {
        const data = await response.json();
        setContainers(data);
      }
    } catch (error) {
      console.error('Error refreshing containers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContainerAction = async (containerId: string, action: string) => {
    try {
      const response = await fetch(`/api/firecracker/workspaces/${workspace.id}/containers/${containerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await refreshContainers();
      } else {
        console.error('Container action failed:', await response.text());
      }
    } catch (error) {
      console.error('Error performing container action:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Badge variant="default" className="text-xs">Running</Badge>;
      case 'STOPPED':
        return <Badge variant="secondary" className="text-xs">Stopped</Badge>;
      case 'PAUSED':
        return <Badge variant="outline" className="text-xs">Paused</Badge>;
      case 'ERROR':
        return <Badge variant="destructive" className="text-xs">Error</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'text-green-500';
      case 'STOPPED':
        return 'text-gray-500';
      case 'PAUSED':
        return 'text-yellow-500';
      case 'ERROR':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Container className="h-4 w-4" />
            Containers
            <Badge variant="outline" className="text-xs">
              {containers.length}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshContainers}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
            
            <Button variant="ghost" size="sm">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-auto">
        {containers.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Container className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No containers</p>
            <Button variant="outline" size="sm" className="mt-2">
              <Plus className="h-3 w-3 mr-1" />
              Create Container
            </Button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {containers.map((container) => (
              <div
                key={container.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded text-sm cursor-pointer hover:bg-muted/50",
                  selectedContainer === container.id && "bg-primary/10 text-primary",
                  "group"
                )}
                onClick={() => {
                  setSelectedContainer(container.id);
                  onContainerSelect?.(container.id);
                }}
              >
                <div className={cn("h-2 w-2 rounded-full", getStatusColor(container.status))} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{container.name}</span>
                    {getStatusBadge(container.status)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {container.image}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {container.status === 'STOPPED' && (
                      <DropdownMenuItem onClick={() => handleContainerAction(container.id, 'start')}>
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </DropdownMenuItem>
                    )}
                    
                    {container.status === 'RUNNING' && (
                      <>
                        <DropdownMenuItem onClick={() => handleContainerAction(container.id, 'pause')}>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleContainerAction(container.id, 'stop')}>
                          <Square className="h-4 w-4 mr-2" />
                          Stop
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {container.status === 'PAUSED' && (
                      <DropdownMenuItem onClick={() => handleContainerAction(container.id, 'unpause')}>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem>
                      <Terminal className="h-4 w-4 mr-2" />
                      Open Terminal
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem>
                      <Activity className="h-4 w-4 mr-2" />
                      View Logs
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleContainerAction(container.id, 'remove')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
