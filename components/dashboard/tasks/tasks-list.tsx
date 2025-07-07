"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Clock, MoreHorizontal, User, Calendar } from "lucide-react";
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
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
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

interface TasksListProps {
  projectId: string;
  tasks: Task[];
}

export function TasksList({ projectId, tasks: initialTasks }: TasksListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    setLoading(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      toast.success("Task updated successfully!");
    } catch (error) {
      toast.error("Failed to update task");
    } finally {
      setLoading(null);
    }
  };

  const toggleTaskCompletion = (task: Task) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    updateTaskStatus(task.id, newStatus);
  };

  const priorityColors = {
    LOW: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    HIGH: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  };

  const statusColors = {
    TODO: "bg-gray-500/10 text-gray-500",
    IN_PROGRESS: "bg-blue-500/10 text-blue-500",
    DONE: "bg-green-500/10 text-green-500",
  };

  const groupedTasks = {
    TODO: tasks.filter(task => task.status === "TODO"),
    IN_PROGRESS: tasks.filter(task => task.status === "IN_PROGRESS"),
    DONE: tasks.filter(task => task.status === "DONE"),
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>No tasks in this project yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Create your first task to get started.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {Object.entries(groupedTasks).map(([status, statusTasks]) => (
        <Card key={status}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {status.replace("_", " ")}
              </CardTitle>
              <Badge variant="secondary" className={statusColors[status as keyof typeof statusColors]}>
                {statusTasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1">
                    <Checkbox
                      checked={task.status === "DONE"}
                      onCheckedChange={() => toggleTaskCompletion(task)}
                      disabled={loading === task.id}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium leading-none ${
                          task.status === "DONE" ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => updateTaskStatus(task.id, "TODO")}
                        disabled={task.status === "TODO"}
                      >
                        Mark as Todo
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateTaskStatus(task.id, "IN_PROGRESS")}
                        disabled={task.status === "IN_PROGRESS"}
                      >
                        Mark as In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateTaskStatus(task.id, "DONE")}
                        disabled={task.status === "DONE"}
                      >
                        Mark as Done
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${priorityColors[task.priority]}`}
                    >
                      {task.priority}
                    </Badge>
                    {task.dueDate && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  {task.assignee && (
                    <div className="flex items-center space-x-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={task.assignee.image || ""} />
                        <AvatarFallback className="text-xs">
                          {task.assignee.name?.charAt(0) || task.assignee.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {statusTasks.length === 0 && (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">
                  No {status.toLowerCase().replace("_", " ")} tasks
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}