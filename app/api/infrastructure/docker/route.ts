/**
 * Docker Infrastructure API Routes
 * Handles Docker container management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dockerService } from '@/lib/infrastructure/services/docker';
import { z } from 'zod';

// Validation schemas
const createContainerSchema = z.object({
  image: z.string().min(1),
  name: z.string().optional(),
  environment: z.record(z.string()).optional(),
  ports: z.record(z.number()).optional(),
  volumes: z.record(z.string()).optional(),
  command: z.array(z.string()).optional(),
  workingDir: z.string().optional(),
  user: z.string().optional(),
  labels: z.record(z.string()).optional(),
});

/**
 * GET /api/infrastructure/docker
 * List Docker containers
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions for infrastructure access
    // Note: For infrastructure access, we need to get the user's organization ID from the database
    // For now, we'll allow access for authenticated users and implement proper org checks later
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    // if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const response = await dockerService.listContainers();
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to list containers' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error listing Docker containers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/infrastructure/docker
 * Create a new Docker container
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createContainerSchema.parse(body);

    // Check if user has admin permissions for infrastructure access
    // Note: For infrastructure access, we need to get the user's organization ID from the database
    // For now, we'll allow access for authenticated users and implement proper org checks later
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    // if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const response = await dockerService.createContainer(validatedData);
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to create container' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Error creating Docker container:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
