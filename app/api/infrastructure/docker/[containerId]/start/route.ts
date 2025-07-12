/**
 * Docker Container Start API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dockerService } from '@/lib/infrastructure/services/docker';

interface RouteParams {
  params: {
    containerId: string;
  };
}

/**
 * POST /api/infrastructure/docker/[containerId]/start
 * Start a Docker container
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { containerId } = params;
    if (!containerId) {
      return NextResponse.json({ error: 'Container ID is required' }, { status: 400 });
    }

    // Check if user has admin permissions for infrastructure access
    // Note: For infrastructure access, we need to get the user's organization ID from the database
    // For now, we'll allow access for authenticated users and implement proper org checks later
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    // if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const response = await dockerService.startContainer(containerId);
    
    if (!response.success) {
      if (response.error?.includes('not found')) {
        return NextResponse.json({ error: 'Container not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: response.error || 'Failed to start container' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error starting Docker container:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
