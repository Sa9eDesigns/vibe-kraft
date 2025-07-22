import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { createHash } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; path: string[] } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filePath = params.path.join('/');

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

    // Get file
    const file = await db.workspaceFile.findFirst({
      where: {
        workspaceId: params.id,
        path: filePath
      }
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Update last accessed time
    await db.workspaceFile.update({
      where: { id: file.id },
      data: { lastAccessedAt: new Date() }
    });

    return NextResponse.json({
      file: {
        id: file.id,
        name: file.name,
        path: file.path,
        type: file.isDirectory ? 'directory' : 'file',
        size: Number(file.size),
        mimeType: file.mimeType,
        content: file.content,
        modified: file.updatedAt,
        created: file.createdAt,
        version: file.version
      }
    });

  } catch (error) {
    console.error('Error getting file:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; path: string[] } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filePath = params.path.join('/');
    const body = await request.json();
    const { content } = body;

    if (content === undefined) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
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

    // Find existing file
    const existingFile = await db.workspaceFile.findFirst({
      where: {
        workspaceId: params.id,
        path: filePath
      }
    });

    if (!existingFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (existingFile.isDirectory) {
      return NextResponse.json({ error: "Cannot update directory content" }, { status: 400 });
    }

    // Calculate new hash
    const hash = createHash('sha256').update(content).digest('hex');

    // Update file
    const updatedFile = await db.workspaceFile.update({
      where: { id: existingFile.id },
      data: {
        content,
        hash,
        size: BigInt(Buffer.byteLength(content, 'utf8')),
        version: existingFile.version + 1,
        updatedAt: new Date(),
        lastAccessedAt: new Date()
      }
    });

    return NextResponse.json({
      file: {
        id: updatedFile.id,
        name: updatedFile.name,
        path: updatedFile.path,
        type: updatedFile.isDirectory ? 'directory' : 'file',
        size: Number(updatedFile.size),
        mimeType: updatedFile.mimeType,
        content: updatedFile.content,
        modified: updatedFile.updatedAt,
        created: updatedFile.createdAt,
        version: updatedFile.version
      }
    });

  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; path: string[] } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filePath = params.path.join('/');

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

    // Check if file exists
    const file = await db.workspaceFile.findFirst({
      where: {
        workspaceId: params.id,
        path: filePath
      }
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete file and any children (for directories)
    if (file.isDirectory) {
      await db.workspaceFile.deleteMany({
        where: {
          workspaceId: params.id,
          OR: [
            { path: filePath },
            { path: { startsWith: `${filePath}/` } }
          ]
        }
      });
    } else {
      await db.workspaceFile.delete({
        where: { id: file.id }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
