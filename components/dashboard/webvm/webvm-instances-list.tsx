"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  MoreHorizontal, 
  Server, 
  Play, 
  Square, 
  AlertCircle, 
  Loader2,
  Pause,
  RotateCcw 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useWebVMInstances, 
  useControlWebVMInstance, 
  useDeleteWebVMInstance 
} from "@/hooks/use-webvm-instances";
import { WebVMInstanceQueryInput } from "@/lib/validations/workspace";
import { toast } from "sonner";

interface WebVMInstancesListProps {
  organizationId: string;
  query?: WebVMInstanceQueryInput;
}

const statusConfig = {
  STARTING: { label: "Starting", variant: "secondary" as const, icon: Loader2 },
  RUNNING: { label: "Running", variant: "default" as const, icon: Play },
  STOPPING: { label: "Stopping", variant: "secondary" as const, icon: Loader2 },
  STOPPED: { label: "Stopped", variant: "outline" as const, icon: Square },
  ERROR: { label: "Error", variant: "destructive" as const, icon: AlertCircle },
  SUSPENDED: { label: "Suspended", variant: "secondary" as const, icon: Pause },
};

export function WebVMInstancesList({ organizationId, query }: WebVMInstancesListProps) {
  const { instances, isLoading, isError, mutate } = useWebVMInstances(organizationId, query);
  const { controlInstance, isLoading: isControlling } = useControlWebVMInstance();
  const { deleteInstance, isLoading: isDeleting } = useDeleteWebVMInstance();
  const [controllingId, setControllingId] = useState<string | null>(null);

  const handleControl = async (instanceId: string, action: 'start' | 'stop' | 'restart') => {
    setControllingId(instanceId);
    try {
      await controlInstance(instanceId, action);
      mutate();
      toast.success(`Instance ${action} initiated successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} instance`);
    } finally {
      setControllingId(null);
    }
  };

  const handleDelete = async (instanceId: string, instanceName: string) => {
    if (!confirm(`Are you sure you want to delete "${instanceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteInstance(instanceId);
      mutate();
      toast.success("Instance deleted successfully");
    } catch (error) {
      toast.error("Failed to delete instance");
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-destructive">Error loading instances</h3>
          <p className="text-sm text-muted-foreground mt-2">Failed to fetch WebVM instances</p>
        </div>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No instances yet</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Create your first WebVM instance to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {instances.map((instance) => {
        const statusInfo = statusConfig[instance.status as keyof typeof statusConfig];
        const StatusIcon = statusInfo.icon;
        const isControllingThis = controllingId === instance.id;
        
        return (
          <Card key={instance.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  <Link 
                    href={`/dashboard/webvm/${instance.id}`}
                    className="hover:underline"
                  >
                    {instance.name}
                  </Link>
                </CardTitle>
                <CardDescription className="text-xs">
                  {instance.workspace?.name}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/webvm/${instance.id}`}>
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  {instance.connectionUrl && (
                    <DropdownMenuItem asChild>
                      <a href={instance.connectionUrl} target="_blank" rel="noopener noreferrer">
                        Open WebVM
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>Edit Instance</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Control</DropdownMenuLabel>
                  {instance.status === "STOPPED" && (
                    <DropdownMenuItem
                      onClick={() => handleControl(instance.id, "start")}
                      disabled={isControllingThis || isControlling}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </DropdownMenuItem>
                  )}
                  {instance.status === "RUNNING" && (
                    <DropdownMenuItem
                      onClick={() => handleControl(instance.id, "stop")}
                      disabled={isControllingThis || isControlling}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </DropdownMenuItem>
                  )}
                  {(instance.status === "RUNNING" || instance.status === "STOPPED") && (
                    <DropdownMenuItem
                      onClick={() => handleControl(instance.id, "restart")}
                      disabled={isControllingThis || isControlling}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restart
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => handleDelete(instance.id, instance.name)}
                    disabled={isDeleting}
                  >
                    Delete Instance
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={statusInfo.variant} className="text-xs">
                    <StatusIcon className={`h-3 w-3 mr-1 ${
                      statusInfo.icon === Loader2 ? 'animate-spin' : ''
                    }`} />
                    {statusInfo.label}
                  </Badge>
                  {instance.config?.memory && (
                    <span className="text-xs text-muted-foreground">
                      {instance.config.memory}MB RAM
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Server className="h-3 w-3" />
                    <span>{instance.workspace?.project?.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(instance.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {instance.config && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Configuration:</p>
                    <div className="flex flex-wrap gap-1">
                      {instance.config.cpu && (
                        <Badge variant="outline" className="text-xs">
                          {instance.config.cpu} CPU
                        </Badge>
                      )}
                      {instance.config.disk && (
                        <Badge variant="outline" className="text-xs">
                          {instance.config.disk}MB Disk
                        </Badge>
                      )}
                      {instance.config.networkMode && (
                        <Badge variant="outline" className="text-xs">
                          {instance.config.networkMode}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {instance.startedAt && instance.status === "RUNNING" && (
                  <div className="text-xs text-muted-foreground">
                    Started: {new Date(instance.startedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
