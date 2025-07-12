/**
 * Firecracker Instance Command Execution API Route
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

const execCommandSchema = z.object({
  command: z.string().min(1),
  timeout: z.number().min(1000).max(300000).default(30000), // 1s to 5min
});

/**
 * POST /api/infrastructure/firecracker/[instanceId]/exec
 * Execute a command in a Firecracker instance
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { instanceId } = params;
    if (!instanceId) {
      return NextResponse.json({ error: 'Instance ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = execCommandSchema.parse(body);

    // Check if user has admin permissions for infrastructure access
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const response = await firecrackerService.executeCommand(
      instanceId,
      validatedData.command,
      validatedData.timeout
    );
    
    if (!response.success) {
      if (response.error?.includes('not found')) {
        return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: response.error || 'Failed to execute command' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error executing command in Firecracker instance:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
