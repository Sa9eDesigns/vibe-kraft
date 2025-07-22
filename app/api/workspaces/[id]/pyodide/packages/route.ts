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

    // Get workspace state to retrieve installed packages
    const state = await db.workspaceState.findFirst({
      where: {
        workspaceId: params.id,
        sessionId: 'default'
      },
      orderBy: { updatedAt: 'desc' }
    });

    const installedPackages = state?.installedPackages || [];

    return NextResponse.json({
      packages: installedPackages
    });

  } catch (error) {
    console.error('Error getting packages:', error);
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
    const { packages } = body;

    if (!Array.isArray(packages)) {
      return NextResponse.json({ error: "Packages must be an array" }, { status: 400 });
    }

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

    // Update workspace state with installed packages
    const state = await db.workspaceState.upsert({
      where: {
        workspaceId_sessionId: {
          workspaceId: params.id,
          sessionId: 'default'
        }
      },
      update: {
        installedPackages: packages,
        updatedAt: new Date()
      },
      create: {
        workspaceId: params.id,
        sessionId: 'default',
        environment: {
          variables: {},
          path: [],
          workingDirectory: '/workspace',
          shell: 'python',
          locale: 'en_US.UTF-8',
          timezone: 'UTC'
        },
        processes: [],
        openFiles: [],
        terminalSessions: [],
        editorState: {},
        gitState: {},
        installedPackages: packages,
        customSettings: {}
      }
    });

    return NextResponse.json({
      packages: state.installedPackages
    });

  } catch (error) {
    console.error('Error updating packages:', error);
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
    const { action, packageName, version } = body;

    if (!action || !packageName) {
      return NextResponse.json({ error: "Action and package name are required" }, { status: 400 });
    }

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

    // Get current state
    const state = await db.workspaceState.findFirst({
      where: {
        workspaceId: params.id,
        sessionId: 'default'
      },
      orderBy: { updatedAt: 'desc' }
    });

    let currentPackages = state?.installedPackages || [];

    if (action === 'install') {
      // Add package if not already installed
      const existingPackage = currentPackages.find((pkg: any) => pkg.name === packageName);
      if (!existingPackage) {
        currentPackages.push({
          name: packageName,
          version: version || 'latest',
          installed: true,
          installedAt: new Date().toISOString()
        });
      }
    } else if (action === 'uninstall') {
      // Remove package
      currentPackages = currentPackages.filter((pkg: any) => pkg.name !== packageName);
    }

    // Update state
    const updatedState = await db.workspaceState.upsert({
      where: {
        workspaceId_sessionId: {
          workspaceId: params.id,
          sessionId: 'default'
        }
      },
      update: {
        installedPackages: currentPackages,
        updatedAt: new Date()
      },
      create: {
        workspaceId: params.id,
        sessionId: 'default',
        environment: {
          variables: {},
          path: [],
          workingDirectory: '/workspace',
          shell: 'python',
          locale: 'en_US.UTF-8',
          timezone: 'UTC'
        },
        processes: [],
        openFiles: [],
        terminalSessions: [],
        editorState: {},
        gitState: {},
        installedPackages: currentPackages,
        customSettings: {}
      }
    });

    return NextResponse.json({
      action,
      packageName,
      packages: updatedState.installedPackages
    });

  } catch (error) {
    console.error('Error managing package:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
