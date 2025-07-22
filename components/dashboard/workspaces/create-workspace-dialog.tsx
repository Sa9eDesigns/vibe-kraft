"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Monitor, Server, Container, Bot } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createWorkspaceSchema, CreateWorkspaceInput } from "@/lib/validations/workspace";
import { useCreateWorkspace } from "@/hooks/use-workspaces";
import { useProjects } from "@/hooks/use-projects";
import { toast } from "sonner";

interface CreateWorkspaceDialogProps {
  organizationId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateWorkspaceDialog({ 
  organizationId, 
  onSuccess,
  trigger 
}: CreateWorkspaceDialogProps) {
  const [open, setOpen] = useState(false);
  const { createWorkspace, isLoading } = useCreateWorkspace();
  const { projects } = useProjects(organizationId);

  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      description: "",
      projectId: "",
      status: "INACTIVE",
    },
  });

  const onSubmit = async (data: CreateWorkspaceInput) => {
    try {
      await createWorkspace({ ...data, organizationId });
      toast.success("Workspace created successfully");
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create workspace");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Workspace
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Create a new development workspace for your project.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Workspace" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your workspace..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || "WEBVM"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workspace type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="WEBVM">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          <div>
                            <div className="font-medium">WebVM</div>
                            <div className="text-xs text-muted-foreground">Browser-based development environment</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="FIRECRACKER">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Firecracker</div>
                            <div className="text-xs text-muted-foreground">MicroVM with container orchestration</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="PYODIDE">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Pyodide</div>
                            <div className="text-xs text-muted-foreground">Python in the browser with WebAssembly</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose between WebVM (browser-based), Firecracker (microVM), or Pyodide (Python) workspace types
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    You can change this later from the workspace settings.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Workspace"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
