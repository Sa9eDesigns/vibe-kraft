"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import {
  Calendar,
  MoreHorizontal,
  Package,
  Users,
  Play,
  Code,
  Settings,
  Bot,
  Monitor,
  Server,
  BookOpen,
  Clock,
  Target,
  Zap,
  FileText,
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaces, useWorkspaceActions } from "@/hooks/use-workspace";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProjectTemplateCard } from "./project-template-card";

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
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [workspaceTypeFilter, setWorkspaceTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Workspace management
  const { workspaces } = useWorkspaces(organizationId);
  const { launchWorkspace } = useWorkspaceActions();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log(`🔍 Fetching projects for organization: ${organizationId}`);
        const response = await fetch(`/api/projects?organizationId=${organizationId}&include=workspaces`);
        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }
        const data = await response.json();
        console.log(`📁 Fetched ${data.length} projects:`, data.map(p => ({
          name: p.name,
          workspaces: p.workspaces?.length || 0,
          pyodideWorkspaces: p.workspaces?.filter(w => w.type === 'PYODIDE').length || 0
        })));
        setProjects(data);
      } catch (err) {
        console.error('❌ Error fetching projects:', err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [organizationId]);

  // Filter and search logic
  const filteredProjects = projects.filter(project => {
    // Search filter
    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !project.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (categoryFilter !== "all") {
      const hasCategory = project.workspaces.some(ws =>
        ws.config?.category === categoryFilter
      );
      if (!hasCategory) return false;
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      const hasDifficulty = project.workspaces.some(ws =>
        ws.config?.difficulty === difficultyFilter
      );
      if (!hasDifficulty) return false;
    }

    // Workspace type filter
    if (workspaceTypeFilter !== "all") {
      const hasType = project.workspaces.some(ws => ws.type === workspaceTypeFilter);
      if (!hasType) return false;
    }

    return true;
  });

  // Helper functions
  const getProjectWorkspaceTypes = (project: Project) => {
    return [...new Set(project.workspaces.map(ws => ws.type))];
  };

  const getProjectCategories = (project: Project) => {
    return [...new Set(project.workspaces.map(ws => ws.config?.category).filter(Boolean))];
  };

  const getProjectDifficulty = (project: Project) => {
    const difficulties = project.workspaces.map(ws => ws.config?.difficulty).filter(Boolean);
    return difficulties[0] || 'beginner';
  };

  const getWorkspaceIcon = (type: string) => {
    switch (type) {
      case 'PYODIDE': return Bot;
      case 'FIRECRACKER': return Server;
      case 'WEBVM': return Monitor;
      default: return Code;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
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

  const getTaskStats = (tasks: Project["tasks"]) => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === "DONE").length;
    const inProgress = tasks.filter(task => task.status === "IN_PROGRESS").length;
    const todo = tasks.filter(task => task.status === "TODO").length;

    return { total, completed, inProgress, todo };
  };

  const getProjectWorkspaces = (projectId: string) => {
    return Array.isArray(workspaces) ? workspaces.filter((workspace: any) => workspace.projectId === projectId) : [];
  };

  const handleLaunchWorkspace = async (projectId: string) => {
    const projectWorkspaces = getProjectWorkspaces(projectId);

    if (projectWorkspaces.length > 0) {
      // Use existing workspace
      const workspace = projectWorkspaces[0];
      const url = await launchWorkspace(workspace.id);
      if (url) {
        router.push(url);
      }
    } else {
      // Create new workspace for project
      router.push(`/workspace?projectId=${projectId}`);
    }
  };

  const handleOpenWorkspaceSettings = (projectId: string) => {
    const projectWorkspaces = getProjectWorkspaces(projectId);

    if (projectWorkspaces.length > 0) {
      router.push(`/dashboard/workspaces/${projectWorkspaces[0].id}`);
    } else {
      // Navigate to workspace creation
      router.push(`/dashboard/workspaces/new?projectId=${projectId}`);
    }
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
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="data-science">Data Science</SelectItem>
              <SelectItem value="web-dev">Web Dev</SelectItem>
              <SelectItem value="games">Games</SelectItem>
              <SelectItem value="ai-ml">AI/ML</SelectItem>
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={workspaceTypeFilter} onValueChange={setWorkspaceTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="PYODIDE">Pyodide</SelectItem>
              <SelectItem value="WEBVM">WebVM</SelectItem>
              <SelectItem value="FIRECRACKER">Firecracker</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredProjects.length} of {projects.length} projects
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
      </div>

      {/* Projects Grid/List */}
      <div className={cn(
        viewMode === "grid"
          ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          : "space-y-4"
      )}>
        {filteredProjects.map((project) => {
        const stats = getTaskStats(project.tasks);
        const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        const workspaceTypes = getProjectWorkspaceTypes(project);
        const categories = getProjectCategories(project);
        const difficulty = getProjectDifficulty(project);
        const primaryWorkspace = project.workspaces[0];

        // Use template card for Pyodide projects with learning objectives
        const isPyodideTemplate = primaryWorkspace?.type === 'PYODIDE' &&
          primaryWorkspace?.config?.learningObjectives &&
          primaryWorkspace.config.learningObjectives.length > 0;

        console.log(`🎯 Project: ${project.name}`, {
          primaryWorkspace: primaryWorkspace?.type,
          hasLearningObjectives: !!primaryWorkspace?.config?.learningObjectives,
          objectivesCount: primaryWorkspace?.config?.learningObjectives?.length || 0,
          isPyodideTemplate
        });

        if (isPyodideTemplate) {
          console.log(`✨ Rendering template card for: ${project.name}`);
          return (
            <ProjectTemplateCard
              key={project.id}
              project={project}
              onLaunchWorkspace={handleLaunchWorkspace}
              className={viewMode === "list" ? "w-full" : ""}
            />
          );
        }

        return (
          <Card key={project.id} className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm hover:shadow-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="hover:underline"
                      >
                        {project.name}
                      </Link>
                    </CardTitle>
                    {primaryWorkspace && (
                      <Badge variant="outline" className="text-xs">
                        {primaryWorkspace.type.toLowerCase()}
                      </Badge>
                    )}
                  </div>
                  {project.description && (
                    <CardDescription className="text-sm line-clamp-2 text-muted-foreground">
                      {project.description}
                    </CardDescription>
                  )}

                  {/* Workspace Types and Categories */}
                  <div className="flex flex-wrap gap-1">
                    {workspaceTypes.map((type) => {
                      const Icon = getWorkspaceIcon(type);
                      return (
                        <Badge key={type} variant="secondary" className="text-xs">
                          <Icon className="h-3 w-3 mr-1" />
                          {type.toLowerCase()}
                        </Badge>
                      );
                    })}
                    {categories.map((category) => {
                      const Icon = getCategoryIcon(category || '');
                      return (
                        <Badge key={category} variant="outline" className="text-xs">
                          <Icon className="h-3 w-3 mr-1" />
                          {category}
                        </Badge>
                      );
                    })}
                    <Badge className={cn("text-xs border", getDifficultyColor(difficulty))}>
                      <Target className="h-3 w-3 mr-1" />
                      {difficulty}
                    </Badge>
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
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Workspace</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleLaunchWorkspace(project.id)}>
                    <Code className="h-4 w-4 mr-2" />
                    {getProjectWorkspaces(project.id).length > 0 ? 'Open Workspace' : 'Launch Workspace'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenWorkspaceSettings(project.id)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Workspace Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Edit Project</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Learning Objectives for Pyodide Projects */}
                {primaryWorkspace?.config?.learningObjectives && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Learning Objectives</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {primaryWorkspace.config.learningObjectives.slice(0, 2).map((objective, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          {objective}
                        </li>
                      ))}
                      {primaryWorkspace.config.learningObjectives.length > 2 && (
                        <li className="text-xs text-muted-foreground/70">
                          +{primaryWorkspace.config.learningObjectives.length - 2} more...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Project Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Task Progress</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Workspace Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>{stats.total} tasks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      <span>{project.workspaces.length} workspace{project.workspaces.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Estimated Time for Pyodide Projects */}
                {primaryWorkspace?.config?.estimatedTime && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Estimated time: {primaryWorkspace.config.estimatedTime}</span>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 h-8"
                    onClick={() => handleLaunchWorkspace(project.id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Launch
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    asChild
                  >
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <FileText className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  );
}