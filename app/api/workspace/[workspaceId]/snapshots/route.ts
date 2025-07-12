/**
 * Workspace Snapshots API Route
 * Manage workspace snapshots for backup and restoration
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceStateManager } from '@/lib/workspace/services/state-manager';
import { requireAuth, createInfrastructureAuditLog } from '@/lib/auth/infrastructure-auth';
import { InfrastructureAuthError } from '@/lib/auth/infrastructure-auth';

interface RouteParams {
  params: {
    workspaceId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await requireAuth();
    const { workspaceId } = params;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Initialize state manager
    const stateManager = new WorkspaceStateManager(workspaceId);

    // List snapshots
    let snapshots = await stateManager.listSnapshots();

    // Filter by type if specified
    if (type) {
      snapshots = snapshots.filter(snapshot => snapshot.type === type);
    }

    // Apply limit
    snapshots = snapshots.slice(0, limit);

    // Log access
    await createInfrastructureAuditLog(
      'workspace.list_snapshots',
      'workspace',
      workspaceId,
      { count: snapshots.length, type, limit },
      request
    );

    return NextResponse.json({
      success: true,
      snapshots,
      count: snapshots.length,
      workspaceId,
    });

  } catch (error) {
    console.error('Failed to list workspace snapshots:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to list snapshots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await requireAuth();
    const { workspaceId } = params;

    // Parse request body
    const body = await request.json();
    const { name, description, type = 'manual' } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Snapshot name is required' },
        { status: 400 }
      );
    }

    // Validate snapshot name
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name)) {
      return NextResponse.json(
        { error: 'Invalid snapshot name format' },
        { status: 400 }
      );
    }

    // Validate snapshot type
    const validTypes = ['manual', 'automatic', 'checkpoint', 'backup', 'template'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid snapshot type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize state manager
    const stateManager = new WorkspaceStateManager(workspaceId);

    // Create snapshot
    const snapshot = await stateManager.createSnapshot(name, description, type);

    // Log creation
    await createInfrastructureAuditLog(
      'workspace.create_snapshot',
      'workspace_snapshot',
      snapshot.id,
      { 
        workspaceId,
        name,
        type,
        size: snapshot.size,
        fileCount: snapshot.fileCount,
      },
      request
    );

    return NextResponse.json({
      success: true,
      snapshot,
      message: 'Snapshot created successfully',
    });

  } catch (error) {
    console.error('Failed to create workspace snapshot:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await requireAuth();
    const { workspaceId } = params;

    // Get snapshot ID from query parameters
    const { searchParams } = new URL(request.url);
    const snapshotId = searchParams.get('snapshotId');

    if (!snapshotId) {
      return NextResponse.json(
        { error: 'Snapshot ID is required' },
        { status: 400 }
      );
    }

    // Initialize state manager
    const stateManager = new WorkspaceStateManager(workspaceId);

    // Delete snapshot
    await stateManager.deleteSnapshot(snapshotId);

    // Log deletion
    await createInfrastructureAuditLog(
      'workspace.delete_snapshot',
      'workspace_snapshot',
      snapshotId,
      { workspaceId },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Snapshot deleted successfully',
    });

  } catch (error) {
    console.error('Failed to delete workspace snapshot:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete snapshot' },
      { status: 500 }
    );
  }
}

// Restore from snapshot
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await requireAuth();
    const { workspaceId } = params;

    // Parse request body
    const body = await request.json();
    const { snapshotId, sessionId } = body;

    if (!snapshotId || !sessionId) {
      return NextResponse.json(
        { error: 'Snapshot ID and session ID are required' },
        { status: 400 }
      );
    }

    // Initialize state manager
    const stateManager = new WorkspaceStateManager(workspaceId);

    // Restore from snapshot
    await stateManager.restoreFromSnapshot(snapshotId, sessionId);

    // Log restoration
    await createInfrastructureAuditLog(
      'workspace.restore_snapshot',
      'workspace_snapshot',
      snapshotId,
      { workspaceId, sessionId },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Workspace restored from snapshot successfully',
    });

  } catch (error) {
    console.error('Failed to restore workspace from snapshot:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to restore from snapshot' },
      { status: 500 }
    );
  }
}
