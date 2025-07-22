import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'default';

    // Get workspace and verify access
    const workspace = await db.workspace.findUnique({
      where: { id: params.id }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify workspace is Pyodide type
    if (workspace.type !== 'PYODIDE') {
      return NextResponse.json({ error: "Not a Pyodide workspace" }, { status: 400 });
    }

    // Get workspace state
    const state = await db.workspaceState.findFirst({
      where: {
        workspaceId: params.id,
        sessionId
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!state) {
      return NextResponse.json({
        state: null,
        message: 'No state found for workspace'
      });
    }

    return NextResponse.json({
      state: {
        id: state.id,
        workspaceId: state.workspaceId,
        sessionId: state.sessionId,
        environment: state.environment,
        processes: state.processes,
        openFiles: state.openFiles,
        terminalSessions: state.terminalSessions,
        editorState: state.editorState,
        installedPackages: state.installedPackages,
        customSettings: state.customSettings,
        updatedAt: state.updatedAt
      }
    });

  } catch (error) {
    console.error('Error getting workspace state:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      sessionId = 'default',
      environment = {},
      processes = [],
      openFiles = [],
      terminalSessions = [],
      editorState = {},
      installedPackages = [],
      customSettings = {}
    } = body;

    // Get workspace and verify access
    const workspace = await db.workspace.findUnique({
      where: { id: params.id }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify workspace is Pyodide type
    if (workspace.type !== 'PYODIDE') {
      return NextResponse.json({ error: "Not a Pyodide workspace" }, { status: 400 });
    }

    // Upsert workspace state
    const state = await db.workspaceState.upsert({
      where: {
        workspaceId_sessionId: {
          workspaceId: params.id,
          sessionId
        }
      },
      update: {
        environment,
        processes,
        openFiles,
        terminalSessions,
        editorState,
        installedPackages,
        customSettings,
        updatedAt: new Date()
      },
      create: {
        workspaceId: params.id,
        sessionId,
        environment,
        processes,
        openFiles,
        terminalSessions,
        editorState,
        gitState: {}, // Empty for Pyodide workspaces
        installedPackages,
        customSettings
      }
    });

    return NextResponse.json({
      state: {
        id: state.id,
        workspaceId: state.workspaceId,
        sessionId: state.sessionId,
        environment: state.environment,
        processes: state.processes,
        openFiles: state.openFiles,
        terminalSessions: state.terminalSessions,
        editorState: state.editorState,
        installedPackages: state.installedPackages,
        customSettings: state.customSettings,
        updatedAt: state.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving workspace state:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      sessionId = 'default',
      environment,
      processes,
      openFiles,
      terminalSessions,
      editorState,
      installedPackages,
      customSettings
    } = body;

    // Get workspace and verify access
    const workspace = await db.workspace.findUnique({
      where: { id: params.id }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify workspace is Pyodide type
    if (workspace.type !== 'PYODIDE') {
      return NextResponse.json({ error: "Not a Pyodide workspace" }, { status: 400 });
    }

    // Find existing state
    const existingState = await db.workspaceState.findFirst({
      where: {
        workspaceId: params.id,
        sessionId
      }
    });

    if (!existingState) {
      return NextResponse.json({ error: "Workspace state not found" }, { status: 404 });
    }

    // Update only provided fields
    const updateData: any = { updatedAt: new Date() };
    if (environment !== undefined) updateData.environment = environment;
    if (processes !== undefined) updateData.processes = processes;
    if (openFiles !== undefined) updateData.openFiles = openFiles;
    if (terminalSessions !== undefined) updateData.terminalSessions = terminalSessions;
    if (editorState !== undefined) updateData.editorState = editorState;
    if (installedPackages !== undefined) updateData.installedPackages = installedPackages;
    if (customSettings !== undefined) updateData.customSettings = customSettings;

    const updatedState = await db.workspaceState.update({
      where: { id: existingState.id },
      data: updateData
    });

    return NextResponse.json({
      state: {
        id: updatedState.id,
        workspaceId: updatedState.workspaceId,
        sessionId: updatedState.sessionId,
        environment: updatedState.environment,
        processes: updatedState.processes,
        openFiles: updatedState.openFiles,
        terminalSessions: updatedState.terminalSessions,
        editorState: updatedState.editorState,
        installedPackages: updatedState.installedPackages,
        customSettings: updatedState.customSettings,
        updatedAt: updatedState.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating workspace state:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // Get workspace and verify access
    const workspace = await db.workspace.findUnique({
      where: { id: params.id }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify workspace is Pyodide type
    if (workspace.type !== 'PYODIDE') {
      return NextResponse.json({ error: "Not a Pyodide workspace" }, { status: 400 });
    }

    // Delete workspace state(s)
    if (sessionId) {
      await db.workspaceState.deleteMany({
        where: {
          workspaceId: params.id,
          sessionId
        }
      });
    } else {
      // Delete all states for this workspace
      await db.workspaceState.deleteMany({
        where: {
          workspaceId: params.id
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting workspace state:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
