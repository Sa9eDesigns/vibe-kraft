"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Package, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Bot,
  Monitor,
  Server,
  BookOpen,
  TrendingUp,
  Code,
  Zap,
  Target,
  Play,
  Settings,
  FileText,
  Download,
  Share,
  MoreHorizontal,
  ChevronRight,
  Sparkles,
  Star,
  GitBranch,
  Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface EnhancedProjectDetailsProps {
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
      title: string;
      description?: string;
    }>;
    workspaces: Array<{
      id: string;
      name: string;
      type: "WEBVM" | "FIRECRACKER" | "PYODIDE";
      status: "ACTIVE" | "INACTIVE" | "STARTING" | "STOPPING" | "ERROR";
      config?: {
        category?: string;
        difficulty?: string;
        tags?: string[];
        packages?: string[];
        estimatedTime?: string;
        learningObjectives?: string[];
      };
      files?: Array<{
        id: string;
        name: string;
        path: string;
        type: string;
        size: number;
      }>;
    }>;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
  onLaunchWorkspace?: (workspaceId: string) => void;
}

export function EnhancedProjectDetails({ project, onLaunchWorkspace }: EnhancedProjectDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Helper functions
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

  const getWorkspaceIcon = (type: string) => {
    switch (type) {
      case 'PYODIDE': return Bot;
      case 'FIRECRACKER': return Server;
      case 'WEBVM': return Monitor;
      default: return Code;
    }
  };

  const getWorkspaceStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'STARTING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STOPPING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ERROR': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'education': return BookOpen;
      case 'data-science': return TrendingUp;
      case 'web-dev': return Code;
      case 'games': return Zap;
      default: return Package;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'intermediate': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'advanced': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const stats = getTaskStats();
  const primaryWorkspace = project.workspaces[0];
  const isPyodideProject = primaryWorkspace?.type === 'PYODIDE';
  const isTemplateProject = primaryWorkspace?.config?.learningObjectives && primaryWorkspace.config.learningObjectives.length > 0;

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {isTemplateProject && (
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Template
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="text-lg text-muted-foreground max-w-2xl">
              {project.description}
            </p>
          )}
          
          {/* Project Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{project.organization.name}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.workspaces.length}</div>
            <p className="text-xs text-muted-foreground">
              {project.workspaces.filter(ws => ws.status === 'ACTIVE').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highPriority}</div>
            <p className="text-xs text-muted-foreground">
              High priority tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Learning Objectives for Template Projects */}
          {primaryWorkspace?.config?.learningObjectives && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Learning Objectives
                </CardTitle>
                <CardDescription>
                  What you'll learn by completing this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {primaryWorkspace.config.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Project Configuration */}
          {primaryWorkspace?.config && (
            <Card>
              <CardHeader>
                <CardTitle>Project Configuration</CardTitle>
                <CardDescription>
                  Project settings and metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {primaryWorkspace.config.category && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Badge className={cn("border", getCategoryIcon(primaryWorkspace.config.category) ? "pl-2" : "")}>
                        {primaryWorkspace.config.category && (
                          <>
                            {(() => {
                              const Icon = getCategoryIcon(primaryWorkspace.config.category);
                              return <Icon className="h-3 w-3 mr-1" />;
                            })()}
                          </>
                        )}
                        {primaryWorkspace.config.category}
                      </Badge>
                    </div>
                  )}
                  
                  {primaryWorkspace.config.difficulty && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Difficulty</label>
                      <Badge className={cn("border", getDifficultyColor(primaryWorkspace.config.difficulty))}>
                        <Target className="h-3 w-3 mr-1" />
                        {primaryWorkspace.config.difficulty}
                      </Badge>
                    </div>
                  )}
                  
                  {primaryWorkspace.config.estimatedTime && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Estimated Time</label>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {primaryWorkspace.config.estimatedTime}
                      </Badge>
                    </div>
                  )}
                </div>

                {primaryWorkspace.config.tags && primaryWorkspace.config.tags.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <div className="flex flex-wrap gap-1">
                      {primaryWorkspace.config.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {primaryWorkspace.config.packages && primaryWorkspace.config.packages.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Required Packages</label>
                    <div className="flex flex-wrap gap-1">
                      {primaryWorkspace.config.packages.map((pkg) => (
                        <Badge key={pkg} variant="outline" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          {pkg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workspaces" className="space-y-4">
          <div className="grid gap-4">
            {project.workspaces.map((workspace) => {
              const WorkspaceIcon = getWorkspaceIcon(workspace.type);
              return (
                <Card key={workspace.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <WorkspaceIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{workspace.name}</CardTitle>
                          <CardDescription>
                            {workspace.type} workspace
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("border", getWorkspaceStatusColor(workspace.status))}>
                          {workspace.status.toLowerCase()}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => onLaunchWorkspace?.(workspace.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Launch
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {workspace.files && workspace.files.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Files ({workspace.files.length})</h4>
                        <div className="grid gap-2">
                          {workspace.files.slice(0, 5).map((file) => (
                            <div key={file.id} className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>{file.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {file.type}
                              </Badge>
                            </div>
                          ))}
                          {workspace.files.length > 5 && (
                            <div className="text-xs text-muted-foreground">
                              +{workspace.files.length - 5} more files...
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4">
            {project.tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.priority === 'HIGH' ? 'destructive' : task.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                        {task.priority.toLowerCase()}
                      </Badge>
                      <Badge variant={task.status === 'DONE' ? 'default' : task.status === 'IN_PROGRESS' ? 'secondary' : 'outline'}>
                        {task.status.toLowerCase().replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Files</CardTitle>
              <CardDescription>
                Files across all workspaces in this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>File browser coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
