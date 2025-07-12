/**
 * Firecracker Templates API Routes
 * Handles WebVM template management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { firecrackerService } from '@/lib/infrastructure/services/firecracker';
import { getUserOrganizationRole } from '@/lib/data/organization';
import { z } from 'zod';

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1),
  image: z.string().min(1),
  description: z.string().optional(),
  memory: z.string().optional(),
  cpuCount: z.number().optional(),
  diskSize: z.string().optional(),
  environment: z.record(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * GET /api/infrastructure/firecracker/templates
 * List WebVM templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions for infrastructure access
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const response = await firecrackerService.listTemplates();
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to list templates' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error listing Firecracker templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/infrastructure/firecracker/templates
 * Create a new WebVM template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Check if user has admin permissions for infrastructure access
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const response = await firecrackerService.createTemplate(validatedData);
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Error creating Firecracker template:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
