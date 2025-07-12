import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserOrganizationRole } from "@/lib/data/organization";
import { z } from "zod";

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().default("general"),
  kernelImage: z.string().min(1),
  rootfsImage: z.string().min(1),
  config: z.object({
    vm: z.object({
      vcpu_count: z.number().min(1).max(16),
      mem_size_mib: z.number().min(512).max(16384),
      kernel_image_path: z.string(),
      boot_args: z.string().optional(),
      drives: z.array(z.object({
        drive_id: z.string(),
        path_on_host: z.string(),
        is_root_device: z.boolean(),
        is_read_only: z.boolean(),
      })),
      network_interfaces: z.array(z.object({
        iface_id: z.string(),
        host_dev_name: z.string(),
      })).optional(),
    }),
    container_runtime: z.enum(['docker', 'containerd', 'podman']).default('docker'),
    environment: z.object({
      shell: z.string().default('/bin/bash'),
      editor: z.string().default('vim'),
      git_config: z.object({
        user_name: z.string().optional(),
        user_email: z.string().optional(),
      }).optional(),
      environment_variables: z.record(z.string()).optional(),
    }).optional(),
    features: z.object({
      ai_assistant: z.boolean().default(true),
      file_sync: z.boolean().default(true),
      port_forwarding: z.boolean().default(true),
      vnc_access: z.boolean().default(false),
      ssh_access: z.boolean().default(true),
    }).optional(),
    security: z.object({
      enable_seccomp: z.boolean().default(true),
      enable_apparmor: z.boolean().default(true),
      readonly_rootfs: z.boolean().default(false),
      user_namespace: z.boolean().default(true),
    }).optional(),
  }),
  resources: z.object({
    cpu: z.number().min(1).max(16),
    memory: z.number().min(512).max(16384),
    disk: z.number().min(10).max(500),
    network_bandwidth: z.number().optional(),
  }),
  isPublic: z.boolean().default(false),
});

const querySchema = z.object({
  organizationId: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = querySchema.parse(queryParams);

    const where: any = {};

    // If organizationId is provided, check permissions
    if (validatedQuery.organizationId) {
      const userRole = await getUserOrganizationRole(session.user.id, validatedQuery.organizationId);
      if (!userRole) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Filter by category
    if (validatedQuery.category) {
      where.category = validatedQuery.category;
    }

    // Filter by public/private
    if (validatedQuery.isPublic !== undefined) {
      where.isPublic = validatedQuery.isPublic;
    } else {
      // Default to showing public templates if no organization specified
      if (!validatedQuery.organizationId) {
        where.isPublic = true;
      }
    }

    // Search filter
    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: "insensitive" } },
        { description: { contains: validatedQuery.search, mode: "insensitive" } },
        { category: { contains: validatedQuery.search, mode: "insensitive" } },
      ];
    }

    const templates = await db.firecrackerTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: validatedQuery.page && validatedQuery.limit ? (validatedQuery.page - 1) * validatedQuery.limit : undefined,
      take: validatedQuery.limit,
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching Firecracker templates:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query parameters", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // For now, allow any authenticated user to create templates
    // In production, you might want to restrict this to admins
    
    const template = await db.firecrackerTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        kernelImage: validatedData.kernelImage,
        rootfsImage: validatedData.rootfsImage,
        config: validatedData.config,
        resources: validatedData.resources,
        isPublic: validatedData.isPublic,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating Firecracker template:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
