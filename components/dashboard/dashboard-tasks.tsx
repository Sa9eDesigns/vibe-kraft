"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Task {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  assignee?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  project: {
    id: string;
    name: string;
  };
}

interface DashboardTasksProps {
  organizationId?: string;
  userId?: string;
}

export function DashboardTasks({ organizationId, userId }: DashboardTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId) return;
      
      try {
        const params = new URLSearchParams({
          userId,
          ...(organizationId && { organizationId }),
        });
        
        const response = await fetch(`/api/tasks?${params}`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data.slice(0, 5)); // Show only recent 5 tasks
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [userId, organizationId]);

  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        );
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const priorityColors = {
    LOW: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    HIGH: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your tasks for this week.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>
            Your recent tasks across all projects.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/dashboard/projects">View All</a>
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No tasks assigned to you yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between space-x-4"
              >
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={task.status === "DONE"}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium leading-none ${
                        task.status === "DONE" ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.project.name}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={priorityColors[task.priority]}
                      >
                        {task.priority.toLowerCase()}
                      </Badge>
                      {task.dueDate && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      {task.assignee && (
                        <div className="flex items-center space-x-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={task.assignee.image || ""} />
                            <AvatarFallback className="text-xs">
                              {task.assignee.name?.charAt(0) || task.assignee.email?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>View Project</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      Delete
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