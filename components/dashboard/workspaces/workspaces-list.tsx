"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, MoreHorizontal, Monitor, Play, Square, AlertCircle, Server } from "lucide-react";
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
import { useWorkspaces, useUpdateWorkspace, useDeleteWorkspace } from "@/hooks/use-workspaces";
import { WorkspaceQueryInput } from "@/lib/validations/workspace";
import { toast } from "sonner";

interface WorkspacesListProps {
  organizationId: string;
  query?: WorkspaceQueryInput;
}

const statusConfig = {
  ACTIVE: { label: "Active", variant: "default" as const, icon: Play },
  INACTIVE: { label: "Inactive", variant: "secondary" as const, icon: Square },
  ARCHIVED: { label: "Archived", variant: "outline" as const, icon: Square },
  ERROR: { label: "Error", variant: "destructive" as const, icon: AlertCircle },
};

const typeConfig = {
  WEBVM: { label: "WebVM", variant: "default" as const, icon: Monitor, description: "Browser-based" },
  FIRECRACKER: { label: "Firecracker", variant: "secondary" as const, icon: Server, description: "MicroVM" },
};

export function WorkspacesList({ organizationId, query }: WorkspacesListProps) {
  const { workspaces, isLoading, isError, mutate } = useWorkspaces(organizationId, query);
  const { updateWorkspace, isLoading: isUpdating } = useUpdateWorkspace();
  const { deleteWorkspace, isLoading: isDeleting } = useDeleteWorkspace();

  const handleStatusChange = async (workspaceId: string, status: string) => {
    try {
      await updateWorkspace(workspaceId, { status: status as any });
      mutate();
      toast.success(`Workspace status updated to ${status.toLowerCase()}`);
    } catch (error) {
      toast.error("Failed to update workspace status");
    }
  };

  const handleDelete = async (workspaceId: string, workspaceName: string) => {
    if (!confirm(`Are you sure you want to delete "${workspaceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteWorkspace(workspaceId);
      mutate();
      toast.success("Workspace deleted successfully");
    } catch (error) {
      toast.error("Failed to delete workspace");
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
          <h3 className="text-lg font-medium text-destructive">Error loading workspaces</h3>
          <p className="text-sm text-muted-foreground mt-2">Failed to fetch workspaces</p>
        </div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No workspaces yet</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Create your first workspace to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((workspace) => {
        const statusInfo = statusConfig[workspace.status as keyof typeof statusConfig];
        const StatusIcon = statusInfo.icon;
        const typeInfo = typeConfig[workspace.type as keyof typeof typeConfig] || typeConfig.WEBVM;
        const TypeIcon = typeInfo.icon;
        
        return (
          <Card key={workspace.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  <Link 
                    href={`/dashboard/workspaces/${workspace.id}`}
                    className="hover:underline"
                  >
                    {workspace.name}
                  </Link>
                </CardTitle>
                {workspace.description && (
                  <CardDescription className="text-xs line-clamp-2">
                    {workspace.description}
                  </CardDescription>
                )}
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
                    <Link href={`/dashboard/workspaces/${workspace.id}`}>
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Edit Workspace</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => handleStatusChange(workspace.id, status)}
                      disabled={workspace.status === status || isUpdating}
                    >
                      <config.icon className="h-4 w-4 mr-2" />
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => handleDelete(workspace.id, workspace.name)}
                    disabled={isDeleting}
                  >
                    Delete Workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusInfo.variant} className="text-xs">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                    <Badge variant={typeInfo.variant} className="text-xs">
                      <TypeIcon className="h-3 w-3 mr-1" />
                      {typeInfo.label}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {workspace._count?.instances || 0} instances
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    <span>{workspace.project?.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(workspace.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {workspace.instances && workspace.instances.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Recent Instances:</p>
                    <div className="flex flex-wrap gap-1">
                      {workspace.instances.slice(0, 3).map((instance) => (
                        <Badge key={instance.id} variant="outline" className="text-xs">
                          {instance.name}
                        </Badge>
                      ))}
                      {workspace.instances.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{workspace.instances.length - 3} more
                        </Badge>
                      )}
                    </div>
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
