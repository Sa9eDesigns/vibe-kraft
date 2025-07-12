/**
 * Storage Bucket Management API Routes
 * Handles individual bucket operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { storageService } from '@/lib/infrastructure/services/storage';

interface RouteParams {
  params: {
    bucketName: string;
  };
}

/**
 * DELETE /api/infrastructure/storage/[bucketName]
 * Delete a storage bucket
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucketName } = params;
    if (!bucketName) {
      return NextResponse.json({ error: 'Bucket name is required' }, { status: 400 });
    }

    // Check if user has admin permissions for infrastructure access
    // Note: For infrastructure access, we need to get the user's organization ID from the database
    // For now, we'll allow access for authenticated users and implement proper org checks later
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    // if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const response = await storageService.deleteBucket(bucketName);
    
    if (!response.success) {
      if (response.error?.includes('not found')) {
        return NextResponse.json({ error: 'Bucket not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: response.error || 'Failed to delete bucket' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Bucket deleted successfully' });
  } catch (error) {
    console.error('Error deleting storage bucket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
