/**
 * Storage Infrastructure API Routes
 * Handles storage bucket and object management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { storageService } from '@/lib/infrastructure/services/storage';
import { z } from 'zod';

// Validation schemas
const createBucketSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Invalid bucket name format'),
  region: z.string().optional(),
});

// Query schema for future pagination/filtering support
// const querySchema = z.object({
//   page: z.coerce.number().min(1).default(1),
//   limit: z.coerce.number().min(1).max(100).default(20),
// });

/**
 * GET /api/infrastructure/storage
 * List storage buckets
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query validation available if needed for pagination/filtering
    // const { searchParams } = new URL(request.url);
    // const queryParams = Object.fromEntries(searchParams.entries());
    // const validatedQuery = querySchema.parse(queryParams);

    // Check if user has admin permissions for infrastructure access
    // Note: For infrastructure access, we need to get the user's organization ID from the database
    // For now, we'll allow access for authenticated users and implement proper org checks later
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    // if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const response = await storageService.listBuckets();
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to list buckets' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error listing storage buckets:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/infrastructure/storage
 * Create a new storage bucket
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBucketSchema.parse(body);

    // Check if user has admin permissions for infrastructure access
    // Note: For infrastructure access, we need to get the user's organization ID from the database
    // For now, we'll allow access for authenticated users and implement proper org checks later
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    // if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const response = await storageService.createBucket(validatedData.name, validatedData.region);
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to create bucket' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Error creating storage bucket:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
