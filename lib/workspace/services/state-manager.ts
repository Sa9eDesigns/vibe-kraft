/**
 * Workspace State Manager
 * Manages workspace session state, environment persistence, and restoration
 */

import { WorkspaceState, EnvironmentState, ProcessState, WorkspaceSnapshot } from '../types';
import { db } from '@/lib/db';
import { storageService } from '@/lib/infrastructure/services/storage';
import { WorkspaceFileStorage } from './file-storage';

export class WorkspaceStateManager {
  private readonly workspaceId: string;
  private readonly fileStorage: WorkspaceFileStorage;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
    this.fileStorage = new WorkspaceFileStorage(workspaceId);
  }

  // =============================================================================
  // STATE PERSISTENCE
  // =============================================================================

  /**
   * Save current workspace state
   */
  async saveState(sessionId: string, state: Partial<WorkspaceState>): Promise<WorkspaceState> {
    const existingState = await db.workspaceState.findFirst({
      where: {
        workspaceId: this.workspaceId,
        sessionId,
      },
    });

    const stateData = {
      workspaceId: this.workspaceId,
      sessionId,
      environment: state.environment || this.getDefaultEnvironment(),
      processes: state.processes || [],
      openFiles: state.openFiles || [],
      terminalSessions: state.terminalSessions || [],
      editorState: state.editorState || this.getDefaultEditorState(),
      gitState: state.gitState || this.getDefaultGitState(),
      installedPackages: state.installedPackages || [],
      customSettings: state.customSettings || {},
      updatedAt: new Date(),
    };

    let workspaceState;
    if (existingState) {
      workspaceState = await db.workspaceState.update({
        where: { id: existingState.id },
        data: stateData,
      });
    } else {
      workspaceState = await db.workspaceState.create({
        data: stateData,
      });
    }

    return this.mapToWorkspaceState(workspaceState);
  }

  /**
   * Load workspace state for a session
   */
  async loadState(sessionId: string): Promise<WorkspaceState | null> {
    const workspaceState = await db.workspaceState.findFirst({
      where: {
        workspaceId: this.workspaceId,
        sessionId,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!workspaceState) {
      return null;
    }

    return this.mapToWorkspaceState(workspaceState);
  }

  /**
   * Get the latest state for workspace (any session)
   */
  async getLatestState(): Promise<WorkspaceState | null> {
    const workspaceState = await db.workspaceState.findFirst({
      where: {
        workspaceId: this.workspaceId,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!workspaceState) {
      return null;
    }

    return this.mapToWorkspaceState(workspaceState);
  }

  /**
   * Update environment variables
   */
  async updateEnvironment(sessionId: string, environment: Partial<EnvironmentState>): Promise<void> {
    const currentState = await this.loadState(sessionId);
    if (!currentState) {
      throw new Error('No state found for session');
    }

    const updatedEnvironment = {
      ...currentState.environment,
      ...environment,
    };

    await this.saveState(sessionId, {
      ...currentState,
      environment: updatedEnvironment,
    });
  }

  /**
   * Update running processes
   */
  async updateProcesses(sessionId: string, processes: ProcessState[]): Promise<void> {
    const currentState = await this.loadState(sessionId);
    if (!currentState) {
      throw new Error('No state found for session');
    }

    await this.saveState(sessionId, {
      ...currentState,
      processes,
    });
  }

  /**
   * Update open files state
   */
  async updateOpenFiles(sessionId: string, openFiles: any[]): Promise<void> {
    const currentState = await this.loadState(sessionId);
    if (!currentState) {
      throw new Error('No state found for session');
    }

    await this.saveState(sessionId, {
      ...currentState,
      openFiles,
    });
  }

  // =============================================================================
  // SNAPSHOT MANAGEMENT
  // =============================================================================

  /**
   * Create a workspace snapshot
   */
  async createSnapshot(
    name: string,
    description?: string,
    type: 'manual' | 'automatic' | 'checkpoint' | 'backup' | 'template' = 'manual'
  ): Promise<WorkspaceSnapshot> {
    // Get current state
    const currentState = await this.getLatestState();
    if (!currentState) {
      throw new Error('No workspace state found');
    }

    // Get all workspace files
    const files = await this.fileStorage.listFiles();

    // Calculate snapshot size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    // Create snapshot storage location
    const snapshotKey = `workspaces/${this.workspaceId}/snapshots/${Date.now()}-${name}`;

    // Package snapshot data
    const snapshotData = {
      state: currentState,
      files: files,
      metadata: {
        createdAt: new Date(),
        workspaceId: this.workspaceId,
        version: '1.0',
      },
    };

    // Upload snapshot to storage
    const snapshotBlob = new Blob([JSON.stringify(snapshotData)], { type: 'application/json' });
    const uploadResult = await storageService.uploadObject({
      file: new File([snapshotBlob], `${name}.snapshot`),
      key: snapshotKey,
      bucket: 'workspace-snapshots',
      metadata: {
        workspaceId: this.workspaceId,
        snapshotType: type,
        fileCount: files.length.toString(),
      },
    });

    if (!uploadResult.success) {
      throw new Error(`Failed to upload snapshot: ${uploadResult.error}`);
    }

    // Create database record
    const snapshot = await db.workspaceSnapshot.create({
      data: {
        workspaceId: this.workspaceId,
        name,
        description,
        type,
        size: totalSize,
        fileCount: files.length,
        storageLocation: snapshotKey,
        compression: 'none',
        encryption: { enabled: false },
        metadata: {
          tags: [],
          author: 'system',
          version: '1.0',
          dependencies: [],
          runtime: 'nodejs',
          architecture: 'x64',
          customData: {},
        },
      },
    });

    return this.mapToWorkspaceSnapshot(snapshot);
  }

  /**
   * Restore workspace from snapshot
   */
  async restoreFromSnapshot(snapshotId: string, sessionId: string): Promise<void> {
    const snapshot = await db.workspaceSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    // Download snapshot data
    const downloadResult = await storageService.downloadObject({
      bucket: 'workspace-snapshots',
      key: snapshot.storageLocation,
    });

    if (!downloadResult.success) {
      throw new Error(`Failed to download snapshot: ${downloadResult.error}`);
    }

    // Parse snapshot data
    const snapshotText = await downloadResult.data!.text();
    const snapshotData = JSON.parse(snapshotText);

    // Restore workspace state
    await this.saveState(sessionId, snapshotData.state);

    // Restore files
    for (const file of snapshotData.files) {
      try {
        // Get file content from snapshot or storage
        const fileContent = file.content || '';
        await this.fileStorage.storeFile(file.path, fileContent, file.metadata);
      } catch (error) {
        console.error(`Failed to restore file ${file.path}:`, error);
      }
    }
  }

  /**
   * List workspace snapshots
   */
  async listSnapshots(): Promise<WorkspaceSnapshot[]> {
    const snapshots = await db.workspaceSnapshot.findMany({
      where: { workspaceId: this.workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return snapshots.map(snapshot => this.mapToWorkspaceSnapshot(snapshot));
  }

  /**
   * Delete a snapshot
   */
  async deleteSnapshot(snapshotId: string): Promise<void> {
    const snapshot = await db.workspaceSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    // Delete from storage
    await storageService.deleteObject('workspace-snapshots', snapshot.storageLocation);

    // Delete from database
    await db.workspaceSnapshot.delete({
      where: { id: snapshotId },
    });
  }

  // =============================================================================
  // AUTO-SAVE & BACKUP
  // =============================================================================

  /**
   * Enable automatic state saving
   */
  async enableAutoSave(sessionId: string, intervalMs: number = 30000): Promise<void> {
    // This would typically be implemented with a background job or timer
    // For now, we'll just save the preference
    const currentState = await this.loadState(sessionId);
    if (currentState) {
      await this.saveState(sessionId, {
        ...currentState,
        customSettings: {
          ...currentState.customSettings,
          autoSave: {
            enabled: true,
            interval: intervalMs,
          },
        },
      });
    }
  }

  /**
   * Create automatic backup
   */
  async createAutoBackup(): Promise<WorkspaceSnapshot> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return this.createSnapshot(`auto-backup-${timestamp}`, 'Automatic backup', 'automatic');
  }

  /**
   * Clean up old automatic backups
   */
  async cleanupOldBackups(retentionDays: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldSnapshots = await db.workspaceSnapshot.findMany({
      where: {
        workspaceId: this.workspaceId,
        type: 'automatic',
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    for (const snapshot of oldSnapshots) {
      await this.deleteSnapshot(snapshot.id);
    }
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private getDefaultEnvironment(): EnvironmentState {
    return {
      variables: {
        PATH: '/usr/local/bin:/usr/bin:/bin',
        HOME: '/home/workspace',
        USER: 'workspace',
        SHELL: '/bin/bash',
      },
      path: ['/usr/local/bin', '/usr/bin', '/bin'],
      workingDirectory: '/home/workspace',
      shell: '/bin/bash',
      locale: 'en_US.UTF-8',
      timezone: 'UTC',
    };
  }

  private getDefaultEditorState(): any {
    return {
      theme: 'vs-dark',
      fontSize: 14,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: true,
      minimap: true,
      lineNumbers: true,
      extensions: [],
      keybindings: {},
    };
  }

  private getDefaultGitState(): any {
    return {
      status: {
        staged: [],
        unstaged: [],
        untracked: [],
        conflicts: [],
      },
      stashes: [],
    };
  }

  private mapToWorkspaceState(dbState: any): WorkspaceState {
    return {
      id: dbState.id,
      workspaceId: dbState.workspaceId,
      sessionId: dbState.sessionId,
      environment: dbState.environment,
      processes: dbState.processes,
      openFiles: dbState.openFiles,
      terminalSessions: dbState.terminalSessions,
      editorState: dbState.editorState,
      gitState: dbState.gitState,
      installedPackages: dbState.installedPackages,
      customSettings: dbState.customSettings,
      createdAt: dbState.createdAt,
      updatedAt: dbState.updatedAt,
    };
  }

  private mapToWorkspaceSnapshot(dbSnapshot: any): WorkspaceSnapshot {
    return {
      id: dbSnapshot.id,
      workspaceId: dbSnapshot.workspaceId,
      name: dbSnapshot.name,
      description: dbSnapshot.description,
      type: dbSnapshot.type,
      size: dbSnapshot.size,
      fileCount: dbSnapshot.fileCount,
      state: {} as WorkspaceState, // Would be loaded separately
      files: [], // Would be loaded separately
      storageLocation: dbSnapshot.storageLocation,
      compression: dbSnapshot.compression,
      encryption: dbSnapshot.encryption,
      metadata: dbSnapshot.metadata,
      createdAt: dbSnapshot.createdAt,
      expiresAt: dbSnapshot.expiresAt,
    };
  }
}
