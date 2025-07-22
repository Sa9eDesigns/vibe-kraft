import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { createHash } from 'crypto';

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
    const path = searchParams.get('path') || '';

    // Get workspace and verify access
    const workspace = await db.workspace.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { organizationId: true }
        }
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify workspace is Pyodide type
    if (workspace.type !== 'PYODIDE') {
      return NextResponse.json({ error: "Not a Pyodide workspace" }, { status: 400 });
    }

    // Get files in the specified path
    const files = await db.workspaceFile.findMany({
      where: {
        workspaceId: params.id,
        path: path ? { startsWith: path } : undefined,
      },
      orderBy: [
        { isDirectory: 'desc' },
        { name: 'asc' }
      ]
    });

    // Filter to direct children if path is specified
    const directChildren = path 
      ? files.filter(file => {
          const relativePath = file.path.replace(path, '').replace(/^\//, '');
          return relativePath && !relativePath.includes('/');
        })
      : files.filter(file => !file.path.includes('/'));

    return NextResponse.json({
      files: directChildren.map(file => ({
        id: file.id,
        name: file.name,
        path: file.path,
        type: file.isDirectory ? 'directory' : 'file',
        size: Number(file.size),
        mimeType: file.mimeType,
        modified: file.updatedAt,
        created: file.createdAt
      }))
    });

  } catch (error) {
    console.error('Error listing files:', error);
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
    const { path, content = '', isDirectory = false } = body;

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Get workspace and verify access
    const workspace = await db.workspace.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { organizationId: true }
        }
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify workspace is Pyodide type
    if (workspace.type !== 'PYODIDE') {
      return NextResponse.json({ error: "Not a Pyodide workspace" }, { status: 400 });
    }

    // Check if file already exists
    const existingFile = await db.workspaceFile.findFirst({
      where: {
        workspaceId: params.id,
        path
      }
    });

    if (existingFile) {
      return NextResponse.json({ error: "File already exists" }, { status: 409 });
    }

    // Calculate file hash
    const hash = createHash('sha256').update(content).digest('hex');

    // Get file name from path
    const name = path.split('/').pop() || path;

    // Determine MIME type
    const getMimeType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'py': return 'text/x-python';
        case 'js': return 'text/javascript';
        case 'ts': return 'text/typescript';
        case 'html': return 'text/html';
        case 'css': return 'text/css';
        case 'json': return 'application/json';
        case 'md': return 'text/markdown';
        case 'txt': return 'text/plain';
        default: return 'text/plain';
      }
    };

    // Create file record
    const file = await db.workspaceFile.create({
      data: {
        workspaceId: params.id,
        path,
        name,
        type: isDirectory ? 'directory' : 'file',
        size: BigInt(Buffer.byteLength(content, 'utf8')),
        mimeType: isDirectory ? 'inode/directory' : getMimeType(name),
        encoding: 'utf-8',
        content: isDirectory ? null : content,
        hash,
        isDirectory,
        permissions: {
          read: true,
          write: true,
          execute: false
        },
        metadata: {
          language: isDirectory ? null : (name.endsWith('.py') ? 'python' : 'text'),
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        },
        version: 1,
        lastAccessedAt: new Date()
      }
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
        created: file.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating file:', error);
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
    const { path, content } = body;

    if (!path || content === undefined) {
      return NextResponse.json({ error: "Path and content are required" }, { status: 400 });
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
        path
      }
    });

    if (!existingFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
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
        created: updatedFile.createdAt
      }
    });

  } catch (error) {
    console.error('Error updating file:', error);
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
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
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

    // Delete file and any children (for directories)
    await db.workspaceFile.deleteMany({
      where: {
        workspaceId: params.id,
        OR: [
          { path },
          { path: { startsWith: `${path}/` } }
        ]
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
