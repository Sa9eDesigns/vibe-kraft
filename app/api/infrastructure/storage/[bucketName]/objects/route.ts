/**
 * Storage Objects API Routes
 * Handles object operations within buckets
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { storageService } from '@/lib/infrastructure/services/storage';
import { z } from 'zod';

interface RouteParams {
  params: {
    bucketName: string;
  };
}

const querySchema = z.object({
  prefix: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * GET /api/infrastructure/storage/[bucketName]/objects
 * List objects in a bucket
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucketName } = params;
    if (!bucketName) {
      return NextResponse.json({ error: 'Bucket name is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = querySchema.parse(queryParams);

    // Check if user has admin permissions for infrastructure access
    // Note: For infrastructure access, we need to get the user's organization ID from the database
    // For now, we'll allow access for authenticated users and implement proper org checks later
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    // if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const response = await storageService.listObjects(bucketName, validatedQuery.prefix);
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to list objects' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error listing storage objects:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/infrastructure/storage/[bucketName]/objects
 * Upload an object to a bucket
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const key = formData.get('key') as string;

    if (!file || !key) {
      return NextResponse.json({ error: 'File and key are required' }, { status: 400 });
    }

    const uploadRequest = {
      file,
      key,
      bucket: bucketName,
      contentType: file.type,
      metadata: {},
    };

    const response = await storageService.uploadObject(uploadRequest);
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to upload object' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Error uploading storage object:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
