import { z } from "zod";

// Workspace validation schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Workspace name must be less than 100 characters"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED", "ERROR"]).default("INACTIVE"),
  config: z.record(z.any()).optional(), // JSON configuration object
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Workspace name must be less than 100 characters").optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED", "ERROR"]).optional(),
  config: z.record(z.any()).optional(),
});

// WebVM Instance validation schemas
export const createWebVMInstanceSchema = z.object({
  name: z.string().min(1, "Instance name is required").max(100, "Instance name must be less than 100 characters"),
  workspaceId: z.string().min(1, "Workspace is required"),
  imageUrl: z.string().url("Invalid image URL").optional(),
  config: z.object({
    // CheerpX specific configuration
    memory: z.number().min(512).max(8192).default(2048), // Memory in MB
    cpu: z.number().min(1).max(8).default(2), // CPU cores
    disk: z.number().min(1024).max(51200).default(10240), // Disk in MB
    networkMode: z.enum(["bridge", "host", "none"]).default("bridge"),
    enableGPU: z.boolean().default(false),
    environmentVariables: z.record(z.string()).optional(),
    mountPoints: z.array(z.object({
      source: z.string(),
      target: z.string(),
      readonly: z.boolean().default(false),
    })).optional(),
  }).optional(),
  resources: z.object({
    cpuLimit: z.number().min(0.1).max(8).optional(),
    memoryLimit: z.number().min(128).max(8192).optional(),
    diskLimit: z.number().min(512).max(51200).optional(),
  }).optional(),
  networkConfig: z.object({
    ports: z.array(z.object({
      internal: z.number().min(1).max(65535),
      external: z.number().min(1).max(65535).optional(),
      protocol: z.enum(["tcp", "udp"]).default("tcp"),
    })).optional(),
    hostname: z.string().optional(),
    domainName: z.string().optional(),
  }).optional(),
});

export const updateWebVMInstanceSchema = z.object({
  name: z.string().min(1, "Instance name is required").max(100, "Instance name must be less than 100 characters").optional(),
  status: z.enum(["STARTING", "RUNNING", "STOPPING", "STOPPED", "ERROR", "SUSPENDED"]).optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  config: z.object({
    memory: z.number().min(512).max(8192).optional(),
    cpu: z.number().min(1).max(8).optional(),
    disk: z.number().min(1024).max(51200).optional(),
    networkMode: z.enum(["bridge", "host", "none"]).optional(),
    enableGPU: z.boolean().optional(),
    environmentVariables: z.record(z.string()).optional(),
    mountPoints: z.array(z.object({
      source: z.string(),
      target: z.string(),
      readonly: z.boolean().default(false),
    })).optional(),
  }).optional(),
  resources: z.object({
    cpuLimit: z.number().min(0.1).max(8).optional(),
    memoryLimit: z.number().min(128).max(8192).optional(),
    diskLimit: z.number().min(512).max(51200).optional(),
  }).optional(),
  networkConfig: z.object({
    ports: z.array(z.object({
      internal: z.number().min(1).max(65535),
      external: z.number().min(1).max(65535).optional(),
      protocol: z.enum(["tcp", "udp"]).default("tcp"),
    })).optional(),
    hostname: z.string().optional(),
    domainName: z.string().optional(),
  }).optional(),
  connectionUrl: z.string().url("Invalid connection URL").optional(),
});

// WebVM Metric validation schemas
export const createWebVMMetricSchema = z.object({
  instanceId: z.string().min(1, "Instance ID is required"),
  metricType: z.enum(["CPU_USAGE", "MEMORY_USAGE", "DISK_USAGE", "NETWORK_IN", "NETWORK_OUT", "RESPONSE_TIME"]),
  value: z.number(),
  unit: z.string().min(1, "Unit is required"),
});

// Bulk operations schemas
export const bulkUpdateWorkspacesSchema = z.object({
  workspaceIds: z.array(z.string()).min(1, "At least one workspace ID is required"),
  updates: updateWorkspaceSchema,
});

export const bulkUpdateWebVMInstancesSchema = z.object({
  instanceIds: z.array(z.string()).min(1, "At least one instance ID is required"),
  updates: updateWebVMInstanceSchema,
});

// Query schemas for filtering and pagination
export const workspaceQuerySchema = z.object({
  projectId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED", "ERROR"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "status"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const webvmInstanceQuerySchema = z.object({
  workspaceId: z.string().optional(),
  status: z.enum(["STARTING", "RUNNING", "STOPPING", "STOPPED", "ERROR", "SUSPENDED"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "status"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Type exports
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateWebVMInstanceInput = z.infer<typeof createWebVMInstanceSchema>;
export type UpdateWebVMInstanceInput = z.infer<typeof updateWebVMInstanceSchema>;
export type CreateWebVMMetricInput = z.infer<typeof createWebVMMetricSchema>;
export type BulkUpdateWorkspacesInput = z.infer<typeof bulkUpdateWorkspacesSchema>;
export type BulkUpdateWebVMInstancesInput = z.infer<typeof bulkUpdateWebVMInstancesSchema>;
export type WorkspaceQueryInput = z.infer<typeof workspaceQuerySchema>;
export type WebVMInstanceQueryInput = z.infer<typeof webvmInstanceQuerySchema>;
