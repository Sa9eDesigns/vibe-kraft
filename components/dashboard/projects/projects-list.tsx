"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MoreHorizontal, Package, Users } from "lucide-react";
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

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tasks: Array<{
    id: string;
    status: "TODO" | "IN_PROGRESS" | "DONE";
  }>;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ProjectsListProps {
  organizationId: string;
}

export function ProjectsList({ organizationId }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`/api/projects?organizationId=${organizationId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [organizationId]);

  const getTaskStats = (tasks: Project["tasks"]) => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === "DONE").length;
    const inProgress = tasks.filter(task => task.status === "IN_PROGRESS").length;
    const todo = tasks.filter(task => task.status === "TODO").length;
    
    return { total, completed, inProgress, todo };
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-destructive">Error loading projects</h3>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No projects yet</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Create your first project to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const stats = getTaskStats(project.tasks);
        const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        
        return (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  <Link 
                    href={`/dashboard/projects/${project.id}`}
                    className="hover:underline"
                  >
                    {project.name}
                  </Link>
                </CardTitle>
                {project.description && (
                  <CardDescription className="text-xs line-clamp-2">
                    {project.description}
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
                    <Link href={`/dashboard/projects/${project.id}`}>
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Edit Project</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
                
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{stats.total} tasks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {stats.todo > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {stats.todo} Todo
                    </Badge>
                  )}
                  {stats.inProgress > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {stats.inProgress} In Progress
                    </Badge>
                  )}
                  {stats.completed > 0 && (
                    <Badge variant="default" className="text-xs">
                      {stats.completed} Done
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}