/**
 * Firecracker Instance Logs API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { firecrackerService } from '@/lib/infrastructure/services/firecracker';
import { getUserOrganizationRole } from '@/lib/data/organization';
import { z } from 'zod';

interface RouteParams {
  params: {
    instanceId: string;
  };
}

const logsQuerySchema = z.object({
  lines: z.coerce.number().min(1).max(1000).default(100),
});

/**
 * GET /api/infrastructure/firecracker/[instanceId]/logs
 * Get logs from a Firecracker instance
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { instanceId } = params;
    if (!instanceId) {
      return NextResponse.json({ error: 'Instance ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = logsQuerySchema.parse(queryParams);

    // Check if user has admin permissions for infrastructure access
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const response = await firecrackerService.getInstanceLogs(instanceId, validatedQuery.lines);
    
    if (!response.success) {
      if (response.error?.includes('not found')) {
        return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: response.error || 'Failed to get instance logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ logs: response.data });
  } catch (error) {
    console.error('Error getting Firecracker instance logs:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
