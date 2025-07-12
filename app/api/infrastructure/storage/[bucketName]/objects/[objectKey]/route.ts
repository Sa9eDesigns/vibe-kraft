/**
 * Storage Object Management API Routes
 * Handles individual object operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { storageService } from '@/lib/infrastructure/services/storage';

interface RouteParams {
  params: {
    bucketName: string;
    objectKey: string;
  };
}

/**
 * GET /api/infrastructure/storage/[bucketName]/objects/[objectKey]
 * Download an object from a bucket
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucketName, objectKey } = params;
    if (!bucketName || !objectKey) {
      return NextResponse.json({ error: 'Bucket name and object key are required' }, { status: 400 });
    }

    // Check if user has admin permissions for infrastructure access
    // Note: For infrastructure access, we need to get the user's organization ID from the database
    // For now, we'll allow access for authenticated users and implement proper org checks later
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    // if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const downloadRequest = {
      bucket: bucketName,
      key: decodeURIComponent(objectKey),
    };

    const response = await storageService.downloadObject(downloadRequest);
    
    if (!response.success) {
      if (response.error?.includes('not found')) {
        return NextResponse.json({ error: 'Object not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: response.error || 'Failed to download object' },
        { status: 500 }
      );
    }

    // Return the blob as a response
    return new NextResponse(response.data, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${decodeURIComponent(objectKey)}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading storage object:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/infrastructure/storage/[bucketName]/objects/[objectKey]
 * Delete an object from a bucket
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucketName, objectKey } = params;
    if (!bucketName || !objectKey) {
      return NextResponse.json({ error: 'Bucket name and object key are required' }, { status: 400 });
    }

    // Check if user has admin permissions for infrastructure access
    // Note: For infrastructure access, we need to get the user's organization ID from the database
    // For now, we'll allow access for authenticated users and implement proper org checks later
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    // if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const response = await storageService.deleteObject(bucketName, decodeURIComponent(objectKey));
    
    if (!response.success) {
      if (response.error?.includes('not found')) {
        return NextResponse.json({ error: 'Object not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: response.error || 'Failed to delete object' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Object deleted successfully' });
  } catch (error) {
    console.error('Error deleting storage object:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
