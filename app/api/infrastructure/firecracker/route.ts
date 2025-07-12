/**
 * Firecracker Infrastructure API Routes
 * Handles Firecracker WebVM instance management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { firecrackerService } from '@/lib/infrastructure/services/firecracker';
import { getUserOrganizationRole } from '@/lib/data/organization';
import { z } from 'zod';

// Validation schemas
const createInstanceSchema = z.object({
  userId: z.string().min(1),
  workspaceId: z.string().min(1),
  image: z.string().optional(),
  memory: z.string().optional(),
  cpuCount: z.number().optional(),
  diskSize: z.string().optional(),
  vnc: z.boolean().optional(),
  environment: z.record(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const querySchema = z.object({
  userId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * GET /api/infrastructure/firecracker
 * List Firecracker instances
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = querySchema.parse(queryParams);

    // Check if user has admin permissions for infrastructure access
    // Note: For infrastructure access, we need to get the user's organization ID from the database
    // For now, we'll allow access for authenticated users and implement proper org checks later
    // // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    // if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const response = await firecrackerService.listInstances(validatedQuery.userId);
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to list instances' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error listing Firecracker instances:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/infrastructure/firecracker
 * Create a new Firecracker instance
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createInstanceSchema.parse(body);

    // Check if user has admin permissions for infrastructure access
    // Note: For infrastructure access, we need to get the user's organization ID from the database
    // For now, we'll allow access for authenticated users and implement proper org checks later
    // // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    // if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const response = await firecrackerService.createInstance(validatedData);
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to create instance' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Error creating Firecracker instance:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
