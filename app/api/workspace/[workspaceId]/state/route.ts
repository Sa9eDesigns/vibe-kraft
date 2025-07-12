/**
 * Workspace State API Route
 * Manage workspace session state and persistence
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
    const sessionId = searchParams.get('sessionId');

    // Initialize state manager
    const stateManager = new WorkspaceStateManager(workspaceId);

    let state;
    if (sessionId) {
      // Get state for specific session
      state = await stateManager.loadState(sessionId);
    } else {
      // Get latest state for workspace
      state = await stateManager.getLatestState();
    }

    if (!state) {
      return NextResponse.json({
        success: true,
        state: null,
        message: 'No state found for workspace',
      });
    }

    // Log access
    await createInfrastructureAuditLog(
      'workspace.get_state',
      'workspace',
      workspaceId,
      { sessionId: state.sessionId },
      request
    );

    return NextResponse.json({
      success: true,
      state,
      workspaceId,
    });

  } catch (error) {
    console.error('Failed to get workspace state:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get workspace state' },
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
    const { sessionId, state } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!state || typeof state !== 'object') {
      return NextResponse.json(
        { error: 'State object is required' },
        { status: 400 }
      );
    }

    // Initialize state manager
    const stateManager = new WorkspaceStateManager(workspaceId);

    // Save state
    const savedState = await stateManager.saveState(sessionId, state);

    // Log save
    await createInfrastructureAuditLog(
      'workspace.save_state',
      'workspace',
      workspaceId,
      { 
        sessionId,
        hasEnvironment: !!state.environment,
        processCount: state.processes?.length || 0,
        openFileCount: state.openFiles?.length || 0,
        terminalCount: state.terminalSessions?.length || 0,
      },
      request
    );

    return NextResponse.json({
      success: true,
      state: savedState,
      message: 'Workspace state saved successfully',
    });

  } catch (error) {
    console.error('Failed to save workspace state:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save workspace state' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await requireAuth();
    const { workspaceId } = params;

    // Parse request body
    const body = await request.json();
    const { sessionId, updates } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Updates object is required' },
        { status: 400 }
      );
    }

    // Initialize state manager
    const stateManager = new WorkspaceStateManager(workspaceId);

    // Apply specific updates based on the update type
    if (updates.environment) {
      await stateManager.updateEnvironment(sessionId, updates.environment);
    }

    if (updates.processes) {
      await stateManager.updateProcesses(sessionId, updates.processes);
    }

    if (updates.openFiles) {
      await stateManager.updateOpenFiles(sessionId, updates.openFiles);
    }

    // Get updated state
    const updatedState = await stateManager.loadState(sessionId);

    // Log update
    await createInfrastructureAuditLog(
      'workspace.update_state',
      'workspace',
      workspaceId,
      { 
        sessionId,
        updateTypes: Object.keys(updates),
      },
      request
    );

    return NextResponse.json({
      success: true,
      state: updatedState,
      message: 'Workspace state updated successfully',
    });

  } catch (error) {
    console.error('Failed to update workspace state:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update workspace state' },
      { status: 500 }
    );
  }
}
