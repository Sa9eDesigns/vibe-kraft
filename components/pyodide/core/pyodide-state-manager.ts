/**
 * Pyodide State Manager
 * Handles workspace state persistence for Pyodide workspaces
 */

import { PyodideRuntime } from './pyodide-runtime';
import { PyodideFileSystem } from './pyodide-filesystem';
import { PyodidePackageManager } from './pyodide-packages';

export interface PyodideWorkspaceState {
  workspaceId: string;
  sessionId: string;
  environment: {
    variables: Record<string, string>;
    workingDirectory: string;
    pythonVersion: string;
    pyodideVersion: string;
  };
  openFiles: {
    path: string;
    content: string;
    cursorPosition?: { line: number; column: number };
    scrollPosition?: number;
    modified: boolean;
  }[];
  terminalSessions: {
    id: string;
    history: string[];
    currentDirectory: string;
    environment: Record<string, string>;
  }[];
  editorState: {
    activeFile?: string;
    openTabs: string[];
    layout: {
      sidebarCollapsed: boolean;
      bottomCollapsed: boolean;
      panelSizes: Record<string, number>;
    };
  };
  installedPackages: {
    name: string;
    version: string;
    installed: boolean;
    installedAt: string;
  }[];
  pythonGlobals: Record<string, any>;
  customSettings: {
    theme: string;
    fontSize: number;
    autoSave: boolean;
    autoSaveInterval: number;
    pythonPath: string[];
  };
  lastSaved: string;
  version: number;
}

export class PyodideStateManager {
  private workspaceId: string;
  private sessionId: string;
  private runtime: PyodideRuntime;
  private fileSystem: PyodideFileSystem;
  private packageManager: PyodidePackageManager;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private isDirty = false;

  constructor(
    workspaceId: string,
    runtime: PyodideRuntime,
    fileSystem: PyodideFileSystem,
    packageManager: PyodidePackageManager,
    sessionId: string = 'default'
  ) {
    this.workspaceId = workspaceId;
    this.sessionId = sessionId;
    this.runtime = runtime;
    this.fileSystem = fileSystem;
    this.packageManager = packageManager;
  }

  /**
   * Initialize state manager and load existing state
   */
  async initialize(): Promise<void> {
    try {
      await this.loadState();
      this.startAutoSave();
    } catch (error) {
      console.warn('Failed to load workspace state:', error);
      // Continue with default state
    }
  }

  /**
   * Get current workspace state
   */
  async getCurrentState(): Promise<PyodideWorkspaceState> {
    const installedPackages = await this.packageManager.getInstalledPackages();
    const pythonGlobals = this.runtime.getGlobals();

    // Get environment variables from Python
    const envResult = await this.runtime.runPython(`
import os
import json
json.dumps(dict(os.environ))
    `);

    const environment = envResult.success ? JSON.parse(envResult.result || '{}') : {};

    return {
      workspaceId: this.workspaceId,
      sessionId: this.sessionId,
      environment: {
        variables: environment,
        workingDirectory: '/workspace',
        pythonVersion: '3.11.0',
        pyodideVersion: '0.28.0'
      },
      openFiles: [], // Will be populated by UI components
      terminalSessions: [], // Will be populated by terminal components
      editorState: {
        openTabs: [],
        layout: {
          sidebarCollapsed: false,
          bottomCollapsed: false,
          panelSizes: {}
        }
      },
      installedPackages: installedPackages.map(pkg => ({
        name: pkg.name,
        version: pkg.version,
        installed: pkg.installed,
        installedAt: new Date().toISOString()
      })),
      pythonGlobals: this.serializeGlobals(pythonGlobals),
      customSettings: {
        theme: 'dark',
        fontSize: 14,
        autoSave: true,
        autoSaveInterval: 30000,
        pythonPath: ['/workspace']
      },
      lastSaved: new Date().toISOString(),
      version: 1
    };
  }

  /**
   * Save current state to database
   */
  async saveState(partialState?: Partial<PyodideWorkspaceState>): Promise<void> {
    try {
      const currentState = await this.getCurrentState();
      const stateToSave = partialState ? { ...currentState, ...partialState } : currentState;

      const response = await fetch(`/api/workspaces/${this.workspaceId}/pyodide/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          environment: stateToSave.environment,
          processes: [], // Pyodide doesn't have traditional processes
          openFiles: stateToSave.openFiles,
          terminalSessions: stateToSave.terminalSessions,
          editorState: stateToSave.editorState,
          installedPackages: stateToSave.installedPackages,
          customSettings: stateToSave.customSettings
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save state: ${response.statusText}`);
      }

      this.isDirty = false;
      console.log('Workspace state saved successfully');

    } catch (error) {
      console.error('Failed to save workspace state:', error);
      throw error;
    }
  }

  /**
   * Load state from database
   */
  async loadState(): Promise<PyodideWorkspaceState | null> {
    try {
      const response = await fetch(
        `/api/workspaces/${this.workspaceId}/pyodide/state?sessionId=${this.sessionId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No saved state
        }
        throw new Error(`Failed to load state: ${response.statusText}`);
      }

      const data = await response.json();
      const state = data.state;

      if (!state) {
        return null;
      }

      // Restore Python environment
      await this.restoreEnvironment(state);

      // Restore installed packages
      await this.restorePackages(state.installedPackages || []);

      // Restore Python globals
      if (state.customSettings?.pythonGlobals) {
        await this.restoreGlobals(state.customSettings.pythonGlobals);
      }

      console.log('Workspace state loaded successfully');
      return state;

    } catch (error) {
      console.error('Failed to load workspace state:', error);
      throw error;
    }
  }

  /**
   * Update specific part of the state
   */
  async updateState(updates: Partial<PyodideWorkspaceState>): Promise<void> {
    this.isDirty = true;
    
    // For immediate updates that need to be persisted
    if (updates.installedPackages || updates.environment) {
      await this.saveState(updates);
    }
  }

  /**
   * Mark state as dirty (needs saving)
   */
  markDirty(): void {
    this.isDirty = true;
  }

  /**
   * Check if state needs saving
   */
  isDirtyState(): boolean {
    return this.isDirty;
  }

  /**
   * Start auto-save functionality
   */
  startAutoSave(interval: number = 30000): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(async () => {
      if (this.isDirty) {
        try {
          await this.saveState();
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, interval);
  }

  /**
   * Stop auto-save functionality
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Restore Python environment from state
   */
  private async restoreEnvironment(state: any): Promise<void> {
    if (state.environment?.variables) {
      for (const [key, value] of Object.entries(state.environment.variables)) {
        await this.runtime.runPython(`
import os
os.environ['${key}'] = '${value}'
        `);
      }
    }

    if (state.environment?.workingDirectory) {
      await this.runtime.runPython(`
import os
os.chdir('${state.environment.workingDirectory}')
      `);
    }
  }

  /**
   * Restore installed packages
   */
  private async restorePackages(packages: any[]): Promise<void> {
    for (const pkg of packages) {
      if (pkg.installed) {
        try {
          await this.packageManager.installPackage(pkg.name);
        } catch (error) {
          console.warn(`Failed to restore package ${pkg.name}:`, error);
        }
      }
    }
  }

  /**
   * Restore Python global variables
   */
  private async restoreGlobals(globals: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(globals)) {
      try {
        if (typeof value === 'string') {
          this.runtime.setGlobal(key, value);
        } else if (typeof value === 'number') {
          this.runtime.setGlobal(key, value);
        } else if (typeof value === 'boolean') {
          this.runtime.setGlobal(key, value);
        }
        // Skip complex objects for now
      } catch (error) {
        console.warn(`Failed to restore global ${key}:`, error);
      }
    }
  }

  /**
   * Serialize Python globals for storage
   */
  private serializeGlobals(globals: any): Record<string, any> {
    const serialized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(globals)) {
      try {
        // Only serialize simple types
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          serialized[key] = value;
        }
      } catch (error) {
        // Skip values that can't be serialized
      }
    }
    
    return serialized;
  }

  /**
   * Export workspace state for backup
   */
  async exportState(): Promise<string> {
    const state = await this.getCurrentState();
    return JSON.stringify(state, null, 2);
  }

  /**
   * Import workspace state from backup
   */
  async importState(stateJson: string): Promise<void> {
    try {
      const state = JSON.parse(stateJson);
      await this.restoreEnvironment(state);
      await this.restorePackages(state.installedPackages || []);
      await this.saveState(state);
    } catch (error) {
      console.error('Failed to import state:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopAutoSave();
    
    // Save final state if dirty
    if (this.isDirty) {
      try {
        await this.saveState();
      } catch (error) {
        console.error('Failed to save final state:', error);
      }
    }
  }
}
