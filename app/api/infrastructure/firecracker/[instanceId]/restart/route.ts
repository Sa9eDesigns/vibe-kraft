/**
 * Firecracker Instance Restart API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { firecrackerService } from '@/lib/infrastructure/services/firecracker';
import { getUserOrganizationRole } from '@/lib/data/organization';

interface RouteParams {
  params: {
    instanceId: string;
  };
}

/**
 * POST /api/infrastructure/firecracker/[instanceId]/restart
 * Restart a Firecracker instance
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

    // Check if user has admin permissions for infrastructure access
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const response = await firecrackerService.restartInstance(instanceId);
    
    if (!response.success) {
      if (response.error?.includes('not found')) {
        return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: response.error || 'Failed to restart instance' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error restarting Firecracker instance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
