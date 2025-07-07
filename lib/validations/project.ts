import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name must be less than 100 characters"),
  description: z.string().optional(),
  organizationId: z.string().min(1, "Organization is required"),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name must be less than 100 characters").optional(),
  description: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Task title must be less than 200 characters"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  projectId: z.string().min(1, "Project is required"),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Task title must be less than 200 characters").optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;