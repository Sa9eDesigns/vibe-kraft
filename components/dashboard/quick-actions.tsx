"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Bot, 
  Monitor, 
  Server, 
  BookOpen, 
  TrendingUp, 
  Code, 
  Zap, 
  Play, 
  Sparkles,
  ChevronRight,
  Clock,
  Target,
  Package
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  organizationId: string;
  className?: string;
}

const TEMPLATE_PROJECTS = [
  {
    id: "hello-python",
    name: "Hello Python",
    description: "Learn Python basics in the browser",
    category: "education",
    difficulty: "beginner",
    estimatedTime: "15 minutes",
    icon: BookOpen,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  {
    id: "data-analysis",
    name: "Data Analysis",
    description: "Pandas, NumPy, and visualization",
    category: "data-science",
    difficulty: "intermediate",
    estimatedTime: "45 minutes",
    icon: TrendingUp,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
  {
    id: "web-scraping",
    name: "Web Scraping",
    description: "Requests and BeautifulSoup",
    category: "web-dev",
    difficulty: "intermediate",
    estimatedTime: "30 minutes",
    icon: Code,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  {
    id: "calculator",
    name: "Interactive Calculator",
    description: "Classes and user input",
    category: "education",
    difficulty: "beginner",
    estimatedTime: "25 minutes",
    icon: Package,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
  },
  {
    id: "adventure-game",
    name: "Text Adventure Game",
    description: "OOP and game mechanics",
    category: "games",
    difficulty: "intermediate",
    estimatedTime: "40 minutes",
    icon: Zap,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
  },
];

export function QuickActions({ organizationId, className }: QuickActionsProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'intermediate': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'advanced': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Quick Create Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Create new projects and workspaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="h-auto p-4 justify-start" asChild>
              <Link href={`/dashboard/projects/new?org=${organizationId}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">New Project</div>
                    <div className="text-xs text-muted-foreground">Start from scratch</div>
                  </div>
                </div>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 justify-start" asChild>
              <Link href={`/dashboard/workspaces/new?org=${organizationId}&type=PYODIDE`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Pyodide Workspace</div>
                    <div className="text-xs text-muted-foreground">Python in browser</div>
                  </div>
                </div>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 justify-start" asChild>
              <Link href={`/dashboard/workspaces/new?org=${organizationId}&type=WEBVM`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Monitor className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">WebVM Workspace</div>
                    <div className="text-xs text-muted-foreground">Full Linux environment</div>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Python Project Templates
              </CardTitle>
              <CardDescription>
                Pre-configured projects to help you learn Python development
              </CardDescription>
            </div>
            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white">
              Ready to use
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TEMPLATE_PROJECTS.map((template) => {
              const Icon = template.icon;
              const isHovered = hoveredTemplate === template.id;
              
              return (
                <div
                  key={template.id}
                  className={cn(
                    "group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                    template.bgColor,
                    template.borderColor,
                    isHovered && "shadow-lg scale-[1.02] border-primary/30"
                  )}
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                >
                  {/* Background gradient on hover */}
                  <div className={cn(
                    "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity",
                    `bg-gradient-to-br ${template.color}`
                  )} />
                  
                  <div className="relative space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg", template.bgColor)}>
                          <Icon className={cn("h-4 w-4", template.textColor)} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{template.name}</h4>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs border", getDifficultyColor(template.difficulty))}>
                        <Target className="h-3 w-3 mr-1" />
                        {template.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {template.estimatedTime}
                      </Badge>
                    </div>

                    {/* Action Button */}
                    <Button 
                      size="sm" 
                      className={cn(
                        "w-full group-hover:shadow-md transition-all",
                        `bg-gradient-to-r ${template.color} hover:opacity-90`
                      )}
                      asChild
                    >
                      <Link href={`/dashboard/projects/template/${template.id}?org=${organizationId}`}>
                        <Play className="h-3 w-3 mr-2" />
                        Start Project
                        <ChevronRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
