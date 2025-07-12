/**
 * Workspace File Storage Service
 * Production-ready file storage and management for persistent workspaces
 */

import { createHash } from 'crypto';
import { join, dirname, basename, extname } from 'path';
import { storageService } from '@/lib/infrastructure/services/storage';
import { WorkspaceFile, FileMetadata, FilePermissions, FileType } from '../types';
import { db } from '@/lib/db';

export class WorkspaceFileStorage {
  private readonly bucketName: string;
  private readonly workspaceId: string;

  constructor(workspaceId: string, bucketName: string = 'workspace-files') {
    this.workspaceId = workspaceId;
    this.bucketName = bucketName;
  }

  // =============================================================================
  // FILE OPERATIONS
  // =============================================================================

  /**
   * Store a file in the workspace
   */
  async storeFile(
    path: string,
    content: Buffer | string,
    metadata?: Partial<FileMetadata>
  ): Promise<WorkspaceFile> {
    const fileHash = this.calculateHash(content);
    const storageKey = this.getStorageKey(path);
    const fileType = this.detectFileType(path, content);
    const isDirectory = false;

    // Upload to MinIO
    const uploadResult = await storageService.uploadObject({
      file: new File([content], basename(path)),
      key: storageKey,
      bucket: this.bucketName,
      metadata: {
        workspaceId: this.workspaceId,
        originalPath: path,
        fileType,
        hash: fileHash,
        ...metadata,
      },
    });

    if (!uploadResult.success) {
      throw new Error(`Failed to store file: ${uploadResult.error}`);
    }

    // Create database record
    const workspaceFile = await db.workspaceFile.create({
      data: {
        workspaceId: this.workspaceId,
        path,
        name: basename(path),
        type: fileType,
        size: Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content),
        mimeType: this.getMimeType(path),
        encoding: 'utf-8',
        hash: fileHash,
        isDirectory,
        permissions: this.getDefaultPermissions(),
        metadata: {
          ...this.analyzeFile(path, content),
          ...metadata,
        },
        version: 1,
        lastAccessedAt: new Date(),
      },
    });

    return this.mapToWorkspaceFile(workspaceFile);
  }

  /**
   * Retrieve a file from the workspace
   */
  async getFile(path: string): Promise<{ file: WorkspaceFile; content: Buffer } | null> {
    const workspaceFile = await db.workspaceFile.findFirst({
      where: {
        workspaceId: this.workspaceId,
        path,
      },
    });

    if (!workspaceFile) {
      return null;
    }

    const storageKey = this.getStorageKey(path);
    const downloadResult = await storageService.downloadObject({
      bucket: this.bucketName,
      key: storageKey,
    });

    if (!downloadResult.success) {
      throw new Error(`Failed to retrieve file: ${downloadResult.error}`);
    }

    // Update last accessed time
    await db.workspaceFile.update({
      where: { id: workspaceFile.id },
      data: { lastAccessedAt: new Date() },
    });

    const content = Buffer.from(await downloadResult.data!.arrayBuffer());
    return {
      file: this.mapToWorkspaceFile(workspaceFile),
      content,
    };
  }

  /**
   * Update a file in the workspace
   */
  async updateFile(
    path: string,
    content: Buffer | string,
    metadata?: Partial<FileMetadata>
  ): Promise<WorkspaceFile> {
    const existingFile = await db.workspaceFile.findFirst({
      where: {
        workspaceId: this.workspaceId,
        path,
      },
    });

    if (!existingFile) {
      throw new Error(`File not found: ${path}`);
    }

    const fileHash = this.calculateHash(content);
    const storageKey = this.getStorageKey(path);

    // Upload updated content
    const uploadResult = await storageService.uploadObject({
      file: new File([content], basename(path)),
      key: storageKey,
      bucket: this.bucketName,
      metadata: {
        workspaceId: this.workspaceId,
        originalPath: path,
        hash: fileHash,
        version: existingFile.version + 1,
        ...metadata,
      },
    });

    if (!uploadResult.success) {
      throw new Error(`Failed to update file: ${uploadResult.error}`);
    }

    // Update database record
    const updatedFile = await db.workspaceFile.update({
      where: { id: existingFile.id },
      data: {
        size: Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content),
        hash: fileHash,
        metadata: {
          ...existingFile.metadata,
          ...this.analyzeFile(path, content),
          ...metadata,
        },
        version: existingFile.version + 1,
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    });

    return this.mapToWorkspaceFile(updatedFile);
  }

  /**
   * Delete a file from the workspace
   */
  async deleteFile(path: string): Promise<void> {
    const workspaceFile = await db.workspaceFile.findFirst({
      where: {
        workspaceId: this.workspaceId,
        path,
      },
    });

    if (!workspaceFile) {
      throw new Error(`File not found: ${path}`);
    }

    const storageKey = this.getStorageKey(path);

    // Delete from MinIO
    const deleteResult = await storageService.deleteObject(this.bucketName, storageKey);
    if (!deleteResult.success) {
      throw new Error(`Failed to delete file from storage: ${deleteResult.error}`);
    }

    // Delete from database
    await db.workspaceFile.delete({
      where: { id: workspaceFile.id },
    });
  }

  /**
   * List files in a directory
   */
  async listFiles(directoryPath: string = ''): Promise<WorkspaceFile[]> {
    const files = await db.workspaceFile.findMany({
      where: {
        workspaceId: this.workspaceId,
        path: {
          startsWith: directoryPath,
        },
      },
      orderBy: [
        { isDirectory: 'desc' },
        { name: 'asc' },
      ],
    });

    return files.map(file => this.mapToWorkspaceFile(file));
  }

  /**
   * Create a directory
   */
  async createDirectory(path: string): Promise<WorkspaceFile> {
    const directoryFile = await db.workspaceFile.create({
      data: {
        workspaceId: this.workspaceId,
        path,
        name: basename(path),
        type: 'directory',
        size: 0,
        mimeType: 'inode/directory',
        encoding: '',
        hash: '',
        isDirectory: true,
        permissions: this.getDefaultPermissions(),
        metadata: {},
        version: 1,
        lastAccessedAt: new Date(),
      },
    });

    return this.mapToWorkspaceFile(directoryFile);
  }

  /**
   * Move/rename a file
   */
  async moveFile(oldPath: string, newPath: string): Promise<WorkspaceFile> {
    const workspaceFile = await db.workspaceFile.findFirst({
      where: {
        workspaceId: this.workspaceId,
        path: oldPath,
      },
    });

    if (!workspaceFile) {
      throw new Error(`File not found: ${oldPath}`);
    }

    const oldStorageKey = this.getStorageKey(oldPath);
    const newStorageKey = this.getStorageKey(newPath);

    // Copy to new location in MinIO
    // Note: MinIO doesn't have a native move operation, so we copy then delete
    const downloadResult = await storageService.downloadObject({
      bucket: this.bucketName,
      key: oldStorageKey,
    });

    if (!downloadResult.success) {
      throw new Error(`Failed to download file for move: ${downloadResult.error}`);
    }

    const uploadResult = await storageService.uploadObject({
      file: new File([await downloadResult.data!.arrayBuffer()], basename(newPath)),
      key: newStorageKey,
      bucket: this.bucketName,
      metadata: {
        workspaceId: this.workspaceId,
        originalPath: newPath,
        movedFrom: oldPath,
      },
    });

    if (!uploadResult.success) {
      throw new Error(`Failed to upload file to new location: ${uploadResult.error}`);
    }

    // Delete old file from MinIO
    await storageService.deleteObject(this.bucketName, oldStorageKey);

    // Update database record
    const updatedFile = await db.workspaceFile.update({
      where: { id: workspaceFile.id },
      data: {
        path: newPath,
        name: basename(newPath),
        updatedAt: new Date(),
      },
    });

    return this.mapToWorkspaceFile(updatedFile);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private getStorageKey(path: string): string {
    return `workspaces/${this.workspaceId}/files${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private calculateHash(content: Buffer | string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private detectFileType(path: string, content: Buffer | string): FileType {
    const ext = extname(path).toLowerCase();
    
    // Check if it's binary content
    if (Buffer.isBuffer(content)) {
      // Simple binary detection
      for (let i = 0; i < Math.min(content.length, 1024); i++) {
        if (content[i] === 0) {
          return 'binary';
        }
      }
    }

    // Image files
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) {
      return 'image';
    }

    // Video files
    if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(ext)) {
      return 'video';
    }

    // Audio files
    if (['.mp3', '.wav', '.flac', '.aac', '.ogg'].includes(ext)) {
      return 'audio';
    }

    // Archive files
    if (['.zip', '.tar', '.gz', '.rar', '.7z'].includes(ext)) {
      return 'archive';
    }

    // Executable files
    if (['.exe', '.bin', '.app', '.deb', '.rpm'].includes(ext)) {
      return 'executable';
    }

    return 'text';
  }

  private getMimeType(path: string): string {
    const ext = extname(path).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.json': 'application/json',
      '.html': 'text/html',
      '.css': 'text/css',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.py': 'text/x-python',
      '.java': 'text/x-java-source',
      '.cpp': 'text/x-c++src',
      '.c': 'text/x-csrc',
      '.go': 'text/x-go',
      '.rs': 'text/x-rust',
      '.php': 'text/x-php',
      '.rb': 'text/x-ruby',
      '.sh': 'application/x-sh',
      '.yml': 'application/x-yaml',
      '.yaml': 'application/x-yaml',
      '.xml': 'application/xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  private getDefaultPermissions(): FilePermissions {
    return {
      owner: { read: true, write: true, execute: false },
      group: { read: true, write: false, execute: false },
      other: { read: true, write: false, execute: false },
    };
  }

  private analyzeFile(path: string, content: Buffer | string): Partial<FileMetadata> {
    const metadata: Partial<FileMetadata> = {};
    const ext = extname(path).toLowerCase();

    // Detect programming language
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.sh': 'bash',
      '.html': 'html',
      '.css': 'css',
      '.json': 'json',
      '.xml': 'xml',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.md': 'markdown',
    };

    metadata.language = languageMap[ext];

    // Analyze text content
    if (typeof content === 'string' || !Buffer.isBuffer(content)) {
      const textContent = content.toString();
      metadata.lineCount = textContent.split('\n').length;
      metadata.characterCount = textContent.length;
      metadata.isBinary = false;
    } else {
      metadata.isBinary = true;
    }

    // Check if executable
    metadata.isExecutable = ['.exe', '.bin', '.app', '.sh'].includes(ext);

    return metadata;
  }

  private mapToWorkspaceFile(dbFile: any): WorkspaceFile {
    return {
      id: dbFile.id,
      workspaceId: dbFile.workspaceId,
      path: dbFile.path,
      name: dbFile.name,
      type: dbFile.type as FileType,
      size: dbFile.size,
      mimeType: dbFile.mimeType,
      encoding: dbFile.encoding,
      hash: dbFile.hash,
      parentId: dbFile.parentId,
      isDirectory: dbFile.isDirectory,
      permissions: dbFile.permissions as FilePermissions,
      metadata: dbFile.metadata as FileMetadata,
      createdAt: dbFile.createdAt,
      updatedAt: dbFile.updatedAt,
      lastAccessedAt: dbFile.lastAccessedAt,
      version: dbFile.version,
    };
  }
}
