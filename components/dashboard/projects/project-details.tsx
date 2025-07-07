"use client";

import { Calendar, Package, Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ProjectDetailsProps {
  project: {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    tasks: Array<{
      id: string;
      status: "TODO" | "IN_PROGRESS" | "DONE";
      priority: "LOW" | "MEDIUM" | "HIGH";
    }>;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const getTaskStats = () => {
    const total = project.tasks.length;
    const completed = project.tasks.filter(task => task.status === "DONE").length;
    const inProgress = project.tasks.filter(task => task.status === "IN_PROGRESS").length;
    const todo = project.tasks.filter(task => task.status === "TODO").length;
    
    const highPriority = project.tasks.filter(task => task.priority === "HIGH").length;
    const mediumPriority = project.tasks.filter(task => task.priority === "MEDIUM").length;
    const lowPriority = project.tasks.filter(task => task.priority === "LOW").length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      inProgress,
      todo,
      highPriority,
      mediumPriority,
      lowPriority,
      completionRate,
    };
  };

  const stats = getTaskStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            Tasks in this project
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <p className="text-xs text-muted-foreground">
            {stats.completionRate}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <p className="text-xs text-muted-foreground">
            Currently being worked on
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
          <p className="text-xs text-muted-foreground">
            Urgent tasks requiring attention
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
          <CardDescription>
            {project.description || "No description provided"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span className="font-medium">{stats.completionRate}%</span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="w-3 h-3 p-0 rounded-full" />
              <span>{stats.todo} Todo</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-3 h-3 p-0 rounded-full bg-blue-100" />
              <span>{stats.inProgress} In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="w-3 h-3 p-0 rounded-full bg-green-500" />
              <span>{stats.completed} Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}