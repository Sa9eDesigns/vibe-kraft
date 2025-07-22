"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Bot, 
  Monitor, 
  Server, 
  BookOpen, 
  TrendingUp, 
  Code, 
  Zap, 
  Package,
  Target,
  Clock,
  Play,
  FileText,
  Star,
  Users,
  Calendar,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProjectTemplateCardProps {
  project: {
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
  };
  onLaunchWorkspace?: (projectId: string) => void;
  className?: string;
}

export function ProjectTemplateCard({ 
  project, 
  onLaunchWorkspace,
  className 
}: ProjectTemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Helper functions
  const getTaskStats = () => {
    const total = project.tasks.length;
    const completed = project.tasks.filter(task => task.status === "DONE").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, completionRate };
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
      case 'beginner': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'intermediate': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'advanced': return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'education': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'data-science': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'web-dev': return 'bg-green-50 text-green-700 border-green-200';
      case 'games': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const stats = getTaskStats();
  const primaryWorkspace = project.workspaces[0];
  const WorkspaceIcon = primaryWorkspace ? getWorkspaceIcon(primaryWorkspace.type) : Code;
  const CategoryIcon = primaryWorkspace?.config?.category ? getCategoryIcon(primaryWorkspace.config.category) : Package;

  const isPyodideProject = primaryWorkspace?.type === 'PYODIDE';
  const isTemplateProject = primaryWorkspace?.config?.learningObjectives && primaryWorkspace.config.learningObjectives.length > 0;

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10",
        "border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50",
        isHovered && "scale-[1.02] shadow-2xl shadow-primary/20",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Template Badge */}
      {isTemplateProject && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white border-0 shadow-lg">
            <Sparkles className="h-3 w-3 mr-1" />
            Template
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4 relative z-10">
        <div className="space-y-3">
          {/* Header with Icon and Type */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg transition-colors duration-200",
                isPyodideProject ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
              )}>
                <WorkspaceIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors duration-200">
                  <Link 
                    href={`/dashboard/projects/${project.id}`}
                    className="hover:underline"
                  >
                    {project.name}
                  </Link>
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {primaryWorkspace?.type.toLowerCase() || 'project'}
                  </Badge>
                  {primaryWorkspace?.config?.category && (
                    <Badge className={cn("text-xs border", getCategoryColor(primaryWorkspace.config.category))}>
                      <CategoryIcon className="h-3 w-3 mr-1" />
                      {primaryWorkspace.config.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <CardDescription className="text-sm leading-relaxed line-clamp-2">
              {project.description}
            </CardDescription>
          )}

          {/* Difficulty and Time */}
          {primaryWorkspace?.config && (
            <div className="flex items-center gap-2">
              {primaryWorkspace.config.difficulty && (
                <Badge className={cn("text-xs border", getDifficultyColor(primaryWorkspace.config.difficulty))}>
                  <Target className="h-3 w-3 mr-1" />
                  {primaryWorkspace.config.difficulty}
                </Badge>
              )}
              {primaryWorkspace.config.estimatedTime && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {primaryWorkspace.config.estimatedTime}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 relative z-10">
        <div className="space-y-4">
          {/* Learning Objectives for Template Projects */}
          {primaryWorkspace?.config?.learningObjectives && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                What You'll Learn
              </h4>
              <ul className="space-y-1">
                {primaryWorkspace.config.learningObjectives.slice(0, 3).map((objective, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="leading-relaxed">{objective}</span>
                  </li>
                ))}
                {primaryWorkspace.config.learningObjectives.length > 3 && (
                  <li className="text-xs text-muted-foreground/70 ml-4">
                    +{primaryWorkspace.config.learningObjectives.length - 3} more objectives...
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Progress Section */}
          {stats.total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{stats.completionRate}%</span>
              </div>
              <Progress 
                value={stats.completionRate} 
                className="h-2 bg-secondary"
              />
            </div>
          )}

          {/* Tags */}
          {primaryWorkspace?.config?.tags && primaryWorkspace.config.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {primaryWorkspace.config.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {primaryWorkspace.config.tags.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{primaryWorkspace.config.tags.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              className="flex-1 group/btn"
              onClick={() => onLaunchWorkspace?.(project.id)}
            >
              <Play className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
              Launch Workspace
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              asChild
            >
              <Link href={`/dashboard/projects/${project.id}`}>
                <FileText className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
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
        </div>
      </CardContent>
    </Card>
  );
}
