"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { createWebVMInstanceSchema, CreateWebVMInstanceInput } from "@/lib/validations/workspace";
import { useCreateWebVMInstance } from "@/hooks/use-webvm-instances";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { toast } from "sonner";

interface CreateWebVMDialogProps {
  organizationId: string;
  workspaceId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateWebVMDialog({ 
  organizationId, 
  workspaceId,
  onSuccess,
  trigger 
}: CreateWebVMDialogProps) {
  const [open, setOpen] = useState(false);
  const { createInstance, isLoading } = useCreateWebVMInstance();
  const { workspaces } = useWorkspaces(organizationId);

  const form = useForm<CreateWebVMInstanceInput>({
    resolver: zodResolver(createWebVMInstanceSchema),
    defaultValues: {
      name: "",
      workspaceId: workspaceId || "",
      imageUrl: "",
      config: {
        memory: 2048,
        cpu: 2,
        disk: 10240,
        networkMode: "bridge",
        enableGPU: false,
        environmentVariables: {},
        mountPoints: [],
      },
      resources: {
        cpuLimit: 2,
        memoryLimit: 2048,
        diskLimit: 10240,
      },
      networkConfig: {
        ports: [],
        hostname: "",
        domainName: "",
      },
    },
  });

  const onSubmit = async (data: CreateWebVMInstanceInput) => {
    try {
      await createInstance(data);
      toast.success("WebVM instance created successfully");
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create WebVM instance");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Instance
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New WebVM Instance</DialogTitle>
          <DialogDescription>
            Create a new CheerpX WebVM instance for your workspace.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instance Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My WebVM Instance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="workspaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a workspace" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workspaces.map((workspace) => (
                        <SelectItem key={workspace.id} value={workspace.id}>
                          {workspace.name} ({workspace.project?.name})
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
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/webvm-image.tar" {...field} />
                  </FormControl>
                  <FormDescription>
                    CheerpX WebVM image URL. Leave empty to use default.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Resource Configuration</h4>
              
              <FormField
                control={form.control}
                name="config.memory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Memory (MB): {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={512}
                        max={8192}
                        step={256}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="config.cpu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPU Cores: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={8}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="config.disk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disk Space (MB): {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1024}
                        max={51200}
                        step={1024}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="config.networkMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bridge">Bridge</SelectItem>
                        <SelectItem value="host">Host</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="config.enableGPU"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable GPU Support</FormLabel>
                      <FormDescription>
                        Enable GPU acceleration for the WebVM instance.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
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
                {isLoading ? "Creating..." : "Create Instance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
