"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  BookOpen, 
  TrendingUp, 
  Code, 
  Zap, 
  Package,
  Target,
  Clock,
  Play,
  ArrowLeft,
  CheckCircle,
  FileText,
  Bot,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SeedProject } from "@/components/pyodide/seed-projects/seed-project-templates";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name too long"),
  description: z.string().optional(),
});

type CreateProjectInput = z.infer<typeof createProjectSchema>;

interface ProjectTemplateCreatorProps {
  template: SeedProject;
  organizationId: string;
}

export function ProjectTemplateCreator({ template, organizationId }: ProjectTemplateCreatorProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState(0);

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: template.name,
      description: template.description,
    },
  });

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

  const onSubmit = async (data: CreateProjectInput) => {
    setIsCreating(true);
    setCreationStep(1);

    try {
      // Step 1: Create project
      setCreationStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

      const response = await fetch("/api/projects/template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          organizationId,
          customName: data.name !== template.name ? data.name : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create project");
      }

      // Step 2: Setting up workspace
      setCreationStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Creating files
      setCreationStep(3);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 4: Complete
      setCreationStep(4);
      const result = await response.json();

      toast.success("Project created successfully!");
      
      // Redirect to the new project
      setTimeout(() => {
        router.push(`/dashboard/projects/${result.project.id}`);
      }, 1000);

    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create project");
      setIsCreating(false);
      setCreationStep(0);
    }
  };

  const CategoryIcon = getCategoryIcon(template.category);
  const creationSteps = [
    "Creating project...",
    "Setting up Pyodide workspace...",
    "Creating project files...",
    "Project ready!"
  ];

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Creating Your Project</CardTitle>
            <CardDescription>
              Setting up {template.name} with all files and configurations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {creationSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                    index < creationStep ? "bg-green-100 text-green-700" :
                    index === creationStep ? "bg-primary text-primary-foreground" :
                    "bg-gray-100 text-gray-500"
                  )}>
                    {index < creationStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={cn(
                    "text-sm",
                    index <= creationStep ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            
            <Progress value={(creationStep / (creationSteps.length - 1)) * 100} className="h-2" />
            
            {creationStep === creationSteps.length - 1 && (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Redirecting to your new project...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <CategoryIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Template
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    {template.description}
                  </CardDescription>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={cn("border", getDifficultyColor(template.difficulty))}>
                      <Target className="h-3 w-3 mr-1" />
                      {template.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {template.estimatedTime}
                    </Badge>
                    <Badge variant="outline">
                      <CategoryIcon className="h-3 w-3 mr-1" />
                      {template.category}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Learning Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                What You'll Learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {template.learningObjectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Files Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Files ({template.files.length + 1})
              </CardTitle>
              <CardDescription>
                Files that will be created in your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">README.md</span>
                  <Badge variant="outline" className="text-xs">Documentation</Badge>
                </div>
                {template.files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{file.path}</span>
                    <Badge variant="outline" className="text-xs">
                      {file.path.endsWith('.py') ? 'Python' : 'Text'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Creation Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customize Your Project</CardTitle>
              <CardDescription>
                Personalize the project name and description
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name" {...field} />
                        </FormControl>
                        <FormDescription>
                          Choose a unique name for your project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your project..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Add a custom description for your project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isCreating}>
                    <Play className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Template Tags */}
          {template.tags && template.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Required Packages */}
          {template.packages && template.packages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Required Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {template.packages.map((pkg) => (
                    <div key={pkg} className="flex items-center gap-2 text-sm">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span>{pkg}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
