/**
 * Workspace Files API Route
 * Manage files within persistent workspaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceFileStorage } from '@/lib/workspace/services/file-storage';
import { WorkspaceFileIndexer } from '@/lib/workspace/services/file-indexer';
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

    // TODO: Check if user has access to this workspace
    // const hasAccess = await checkWorkspaceAccess(session.user.id, workspaceId);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    const recursive = searchParams.get('recursive') === 'true';
    const includeContent = searchParams.get('includeContent') === 'true';

    // Initialize file storage
    const fileStorage = new WorkspaceFileStorage(workspaceId);

    // List files
    const files = await fileStorage.listFiles(path);

    // Filter for recursive listing
    let filteredFiles = files;
    if (!recursive && path) {
      const pathDepth = path.split('/').filter(Boolean).length;
      filteredFiles = files.filter(file => {
        const fileDepth = file.path.split('/').filter(Boolean).length;
        return fileDepth <= pathDepth + 1;
      });
    }

    // Include file content if requested (only for text files)
    if (includeContent) {
      const filesWithContent = await Promise.all(
        filteredFiles.map(async (file) => {
          if (file.type === 'text' && file.size < 1024 * 1024) { // Max 1MB
            try {
              const result = await fileStorage.getFile(file.path);
              if (result) {
                return {
                  ...file,
                  content: result.content.toString('utf-8'),
                };
              }
            } catch (error) {
              console.error(`Failed to get content for ${file.path}:`, error);
            }
          }
          return file;
        })
      );
      filteredFiles = filesWithContent;
    }

    // Log access
    await createInfrastructureAuditLog(
      'workspace.list_files',
      'workspace',
      workspaceId,
      { path, fileCount: filteredFiles.length, recursive, includeContent },
      request
    );

    return NextResponse.json({
      success: true,
      workspaceId,
      path,
      files: filteredFiles,
      count: filteredFiles.length,
    });

  } catch (error) {
    console.error('Failed to list workspace files:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to list files' },
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
    const { path, content, metadata, type = 'file' } = body;

    if (!path) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const fileStorage = new WorkspaceFileStorage(workspaceId);
    const fileIndexer = new WorkspaceFileIndexer(workspaceId);

    let result;

    if (type === 'directory') {
      // Create directory
      result = await fileStorage.createDirectory(path);
    } else {
      // Create file
      if (content === undefined) {
        return NextResponse.json(
          { error: 'File content is required' },
          { status: 400 }
        );
      }

      result = await fileStorage.storeFile(path, content, metadata);

      // Index the file if it's a text file
      if (result.type === 'text' && typeof content === 'string') {
        try {
          await fileIndexer.indexFile(result, content);
        } catch (indexError) {
          console.error('Failed to index file:', indexError);
          // Don't fail the request if indexing fails
        }
      }
    }

    // Log creation
    await createInfrastructureAuditLog(
      `workspace.create_${type}`,
      'workspace_file',
      result.id,
      { 
        workspaceId,
        path, 
        size: result.size,
        type: result.type 
      },
      request
    );

    return NextResponse.json({
      success: true,
      file: result,
      message: `${type === 'directory' ? 'Directory' : 'File'} created successfully`,
    });

  } catch (error) {
    console.error('Failed to create workspace file:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await requireAuth();
    const { workspaceId } = params;

    // Parse request body
    const body = await request.json();
    const { path, content, metadata } = body;

    if (!path || content === undefined) {
      return NextResponse.json(
        { error: 'File path and content are required' },
        { status: 400 }
      );
    }

    // Initialize services
    const fileStorage = new WorkspaceFileStorage(workspaceId);
    const fileIndexer = new WorkspaceFileIndexer(workspaceId);

    // Update file
    const result = await fileStorage.updateFile(path, content, metadata);

    // Re-index the file if it's a text file
    if (result.type === 'text' && typeof content === 'string') {
      try {
        await fileIndexer.indexFile(result, content);
      } catch (indexError) {
        console.error('Failed to re-index file:', indexError);
        // Don't fail the request if indexing fails
      }
    }

    // Log update
    await createInfrastructureAuditLog(
      'workspace.update_file',
      'workspace_file',
      result.id,
      { 
        workspaceId,
        path, 
        size: result.size,
        version: result.version 
      },
      request
    );

    return NextResponse.json({
      success: true,
      file: result,
      message: 'File updated successfully',
    });

  } catch (error) {
    console.error('Failed to update workspace file:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await requireAuth();
    const { workspaceId } = params;

    // Get file path from query parameters
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const fileStorage = new WorkspaceFileStorage(workspaceId);
    const fileIndexer = new WorkspaceFileIndexer(workspaceId);

    // Delete file
    await fileStorage.deleteFile(path);

    // Remove from index
    try {
      await fileIndexer.removeFromIndex(path);
    } catch (indexError) {
      console.error('Failed to remove file from index:', indexError);
      // Don't fail the request if index removal fails
    }

    // Log deletion
    await createInfrastructureAuditLog(
      'workspace.delete_file',
      'workspace_file',
      path,
      { workspaceId, path },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Failed to delete workspace file:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
