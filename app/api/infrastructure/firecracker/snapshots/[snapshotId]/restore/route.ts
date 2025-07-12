/**
 * Firecracker Snapshot Restore API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { firecrackerService } from '@/lib/infrastructure/services/firecracker';
import { getUserOrganizationRole } from '@/lib/data/organization';

interface RouteParams {
  params: {
    snapshotId: string;
  };
}

/**
 * POST /api/infrastructure/firecracker/snapshots/[snapshotId]/restore
 * Restore a WebVM snapshot
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { snapshotId } = params;
    if (!snapshotId) {
      return NextResponse.json({ error: 'Snapshot ID is required' }, { status: 400 });
    }

    // Check if user has admin permissions for infrastructure access
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const response = await firecrackerService.restoreSnapshot(snapshotId);
    
    if (!response.success) {
      if (response.error?.includes('not found')) {
        return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: response.error || 'Failed to restore snapshot' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error restoring Firecracker snapshot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
