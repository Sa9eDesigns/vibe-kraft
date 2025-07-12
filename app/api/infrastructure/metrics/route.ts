/**
 * Metrics Infrastructure API Routes
 * Handles infrastructure metrics and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { metricsService } from '@/lib/infrastructure/services/metrics';
import { z } from 'zod';

// Validation schemas
const querySchema = z.object({
  service: z.string().optional(),
  timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).default('1h'),
  granularity: z.enum(['1m', '5m', '15m', '1h', '1d']).default('5m'),
});

/**
 * GET /api/infrastructure/metrics
 * Get infrastructure metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const response = await metricsService.getMetrics(
      validatedQuery.service,
      validatedQuery.timeRange,
      validatedQuery.granularity
    );
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to get metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error getting infrastructure metrics:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
