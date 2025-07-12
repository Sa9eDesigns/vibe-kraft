/**
 * Firecracker Instance Management API Routes
 * Handles individual Firecracker instance operations
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
 * GET /api/infrastructure/firecracker/[instanceId]
 * Get a specific Firecracker instance
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

    // Check if user has admin permissions for infrastructure access
    // Note: For infrastructure access, we need to get the user's organization ID from the database
    // For now, we'll allow access for authenticated users and implement proper org checks later
    // // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    // if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const response = await firecrackerService.getInstance(instanceId);
    
    if (!response.success) {
      if (response.error?.includes('not found')) {
        return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: response.error || 'Failed to get instance' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error getting Firecracker instance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/infrastructure/firecracker/[instanceId]
 * Delete a Firecracker instance
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const response = await firecrackerService.deleteInstance(instanceId);
    
    if (!response.success) {
      if (response.error?.includes('not found')) {
        return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: response.error || 'Failed to delete instance' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Instance deleted successfully' });
  } catch (error) {
    console.error('Error deleting Firecracker instance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
