/**
 * Docker Containers API Route
 * Manage Docker containers for infrastructure
 */

import { NextRequest, NextResponse } from 'next/server';
import { dockerService } from '@/lib/infrastructure/services/docker';
import { requireContainerAccess, createInfrastructureAuditLog } from '@/lib/auth/infrastructure-auth';
import { InfrastructureAuthError, InfrastructureRateLimit } from '@/lib/auth/infrastructure-auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await requireContainerAccess('read');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // List containers
    const result = await dockerService.listContainers(all);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    let containers = result.data || [];

    // Filter by status if specified
    if (status) {
      containers = containers.filter(container => container.status === status);
    }

    // Apply limit
    containers = containers.slice(0, limit);

    // Log access
    await createInfrastructureAuditLog(
      'container.list',
      'container_collection',
      'all',
      { count: containers.length, filters: { all, status, limit } },
      request
    );

    return NextResponse.json({
      success: true,
      containers,
      count: containers.length,
      filters: { all, status, limit },
    });

  } catch (error) {
    console.error('Failed to list containers:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to list containers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await requireContainerAccess('write');

    // Apply rate limiting
    await InfrastructureRateLimit.enforceLimit(
      session.user.id,
      'container.create',
      5, // 5 containers per minute
      60000
    );

    // Parse request body
    const body = await request.json();
    const {
      name,
      image,
      command,
      environment,
      ports,
      volumes,
      restartPolicy,
      networkMode,
      labels,
    } = body;

    // Validate required fields
    if (!name || !image) {
      return NextResponse.json(
        { error: 'Container name and image are required' },
        { status: 400 }
      );
    }

    // Validate container name format
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name)) {
      return NextResponse.json(
        { error: 'Invalid container name format' },
        { status: 400 }
      );
    }

    // Add management labels
    const managementLabels = {
      'vibekraft.managed': 'true',
      'vibekraft.created-by': session.user.id,
      'vibekraft.created-at': new Date().toISOString(),
      ...labels,
    };

    // Create container
    const result = await dockerService.createContainer({
      name,
      image,
      command,
      environment,
      ports,
      volumes,
      restartPolicy,
      networkMode,
      labels: managementLabels,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Log creation
    await createInfrastructureAuditLog(
      'container.create',
      'container',
      result.data!.id,
      { 
        name, 
        image, 
        ports: ports?.length || 0,
        volumes: volumes?.length || 0 
      },
      request
    );

    return NextResponse.json({
      success: true,
      container: result.data,
      message: 'Container created successfully',
    });

  } catch (error) {
    console.error('Failed to create container:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create container' },
      { status: 500 }
    );
  }
}

// Bulk operations endpoint
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await requireContainerAccess('write');

    // Parse request body
    const body = await request.json();
    const { action, containerIds } = body;

    if (!action || !containerIds || !Array.isArray(containerIds)) {
      return NextResponse.json(
        { error: 'Action and container IDs array are required' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['start', 'stop', 'restart', 'delete'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Apply rate limiting for bulk operations
    await InfrastructureRateLimit.enforceLimit(
      session.user.id,
      `container.bulk_${action}`,
      10, // 10 bulk operations per minute
      60000
    );

    const results = [];
    const errors = [];

    // Execute action on each container
    for (const containerId of containerIds) {
      try {
        let result;
        switch (action) {
          case 'start':
            result = await dockerService.startContainer(containerId);
            break;
          case 'stop':
            result = await dockerService.stopContainer(containerId);
            break;
          case 'restart':
            result = await dockerService.restartContainer(containerId);
            break;
          case 'delete':
            result = await dockerService.deleteContainer(containerId);
            break;
        }

        if (result?.success) {
          results.push({ containerId, success: true });
        } else {
          errors.push({ containerId, error: result?.error || 'Unknown error' });
        }
      } catch (error) {
        errors.push({ 
          containerId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // Log bulk operation
    await createInfrastructureAuditLog(
      `container.bulk_${action}`,
      'container_collection',
      containerIds.join(','),
      { 
        action,
        totalContainers: containerIds.length,
        successful: results.length,
        failed: errors.length 
      },
      request
    );

    return NextResponse.json({
      success: true,
      action,
      results,
      errors,
      summary: {
        total: containerIds.length,
        successful: results.length,
        failed: errors.length,
      },
    });

  } catch (error) {
    console.error('Failed to execute bulk container operation:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to execute bulk operation' },
      { status: 500 }
    );
  }
}
