import { EventEmitter } from 'events';

/**
 * Workspace Context Manager
 * Tracks workspace state, file changes, and project context for AI assistance
 */

export interface WorkspaceFile {
  path: string;
  content?: string;
  language?: string;
  lastModified: Date;
  size: number;
  isDirectory: boolean;
}

export interface ProjectContext {
  name: string;
  type: 'nodejs' | 'python' | 'react' | 'nextjs' | 'vue' | 'angular' | 'other';
  framework?: string;
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'poetry';
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  rootPath: string;
  configFiles: string[];
}

export interface WorkspaceState {
  currentDirectory: string;
  openFiles: WorkspaceFile[];
  recentFiles: WorkspaceFile[];
  projectContext?: ProjectContext;
  terminalHistory: string[];
  activeProcesses: Array<{
    pid: number;
    command: string;
    status: 'running' | 'completed' | 'error';
  }>;
  gitStatus?: {
    branch: string;
    hasChanges: boolean;
    stagedFiles: string[];
    unstagedFiles: string[];
    commits: Array<{
      hash: string;
      message: string;
      author: string;
      date: Date;
    }>;
  };
  errors: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

export interface ContextSnapshot {
  timestamp: Date;
  state: WorkspaceState;
  userIntent?: string;
  aiResponse?: string;
}

export class WorkspaceContextManager extends EventEmitter {
  private state: WorkspaceState;
  private snapshots: ContextSnapshot[] = [];
  private maxSnapshots = 50;
  private fileWatchers: Map<string, any> = new Map();
  private updateQueue: Array<() => void> = [];
  private isProcessingQueue = false;

  constructor(initialState?: Partial<WorkspaceState>) {
    super();
    
    this.state = {
      currentDirectory: '/',
      openFiles: [],
      recentFiles: [],
      terminalHistory: [],
      activeProcesses: [],
      errors: [],
      ...initialState
    };

    // Start processing updates
    this.processUpdateQueue();
  }

  // Get current workspace state
  getState(): WorkspaceState {
    return { ...this.state };
  }

  // Get contextual information for AI
  getAIContext(): {
    workspace: WorkspaceState;
    summary: string;
    relevantFiles: WorkspaceFile[];
    recentActivity: string[];
  } {
    const relevantFiles = this.getRelevantFiles();
    const recentActivity = this.getRecentActivity();
    
    return {
      workspace: this.getState(),
      summary: this.generateContextSummary(),
      relevantFiles,
      recentActivity
    };
  }

  // Update current directory
  updateCurrentDirectory(path: string): void {
    this.queueUpdate(() => {
      this.state.currentDirectory = path;
      this.emit('directoryChanged', path);
    });
  }

  // Add or update file
  updateFile(file: WorkspaceFile): void {
    this.queueUpdate(() => {
      const existingIndex = this.state.openFiles.findIndex(f => f.path === file.path);
      
      if (existingIndex >= 0) {
        this.state.openFiles[existingIndex] = file;
      } else {
        this.state.openFiles.push(file);
      }

      // Update recent files
      this.addToRecentFiles(file);
      
      this.emit('fileUpdated', file);
    });
  }

  // Remove file
  removeFile(path: string): void {
    this.queueUpdate(() => {
      this.state.openFiles = this.state.openFiles.filter(f => f.path !== path);
      this.emit('fileRemoved', path);
    });
  }

  // Update project context
  updateProjectContext(context: ProjectContext): void {
    this.queueUpdate(() => {
      this.state.projectContext = context;
      this.emit('projectContextUpdated', context);
    });
  }

  // Add terminal command to history
  addTerminalCommand(command: string): void {
    this.queueUpdate(() => {
      this.state.terminalHistory.push(command);
      
      // Keep only last 100 commands
      if (this.state.terminalHistory.length > 100) {
        this.state.terminalHistory = this.state.terminalHistory.slice(-100);
      }
      
      this.emit('terminalCommandAdded', command);
    });
  }

  // Update git status
  updateGitStatus(gitStatus: WorkspaceState['gitStatus']): void {
    this.queueUpdate(() => {
      this.state.gitStatus = gitStatus;
      this.emit('gitStatusUpdated', gitStatus);
    });
  }

  // Add error
  addError(error: WorkspaceState['errors'][0]): void {
    this.queueUpdate(() => {
      this.state.errors.push(error);
      
      // Keep only last 50 errors
      if (this.state.errors.length > 50) {
        this.state.errors = this.state.errors.slice(-50);
      }
      
      this.emit('errorAdded', error);
    });
  }

  // Clear errors for a file
  clearFileErrors(filePath: string): void {
    this.queueUpdate(() => {
      this.state.errors = this.state.errors.filter(e => e.file !== filePath);
      this.emit('errorsCleared', filePath);
    });
  }

  // Create context snapshot
  createSnapshot(userIntent?: string, aiResponse?: string): ContextSnapshot {
    const snapshot: ContextSnapshot = {
      timestamp: new Date(),
      state: { ...this.state },
      userIntent,
      aiResponse
    };

    this.snapshots.push(snapshot);
    
    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    this.emit('snapshotCreated', snapshot);
    return snapshot;
  }

  // Get recent snapshots
  getRecentSnapshots(count = 10): ContextSnapshot[] {
    return this.snapshots.slice(-count);
  }

  // Get relevant files based on current context
  private getRelevantFiles(): WorkspaceFile[] {
    const relevantFiles: WorkspaceFile[] = [];
    
    // Add currently open files
    relevantFiles.push(...this.state.openFiles);
    
    // Add recently modified files
    const recentFiles = this.state.recentFiles
      .filter(f => !relevantFiles.some(rf => rf.path === f.path))
      .slice(0, 5);
    relevantFiles.push(...recentFiles);
    
    return relevantFiles;
  }

  // Get recent activity summary
  private getRecentActivity(): string[] {
    const activity: string[] = [];
    
    // Recent terminal commands
    const recentCommands = this.state.terminalHistory.slice(-5);
    activity.push(...recentCommands.map(cmd => `Terminal: ${cmd}`));
    
    // Recent file changes
    const recentFiles = this.state.recentFiles.slice(-3);
    activity.push(...recentFiles.map(f => `File modified: ${f.path}`));
    
    // Recent errors
    const recentErrors = this.state.errors.slice(-3);
    activity.push(...recentErrors.map(e => `Error in ${e.file}:${e.line} - ${e.message}`));
    
    return activity.slice(-10); // Keep only last 10 activities
  }

  // Generate context summary for AI
  private generateContextSummary(): string {
    const parts: string[] = [];
    
    // Project info
    if (this.state.projectContext) {
      parts.push(`Project: ${this.state.projectContext.name} (${this.state.projectContext.type})`);
    }
    
    // Current directory
    parts.push(`Current directory: ${this.state.currentDirectory}`);
    
    // Open files count
    if (this.state.openFiles.length > 0) {
      parts.push(`${this.state.openFiles.length} files open`);
    }
    
    // Git status
    if (this.state.gitStatus) {
      parts.push(`Git branch: ${this.state.gitStatus.branch}`);
      if (this.state.gitStatus.hasChanges) {
        parts.push(`${this.state.gitStatus.unstagedFiles.length} unstaged changes`);
      }
    }
    
    // Active processes
    if (this.state.activeProcesses.length > 0) {
      const runningProcesses = this.state.activeProcesses.filter(p => p.status === 'running');
      if (runningProcesses.length > 0) {
        parts.push(`${runningProcesses.length} processes running`);
      }
    }
    
    // Errors
    if (this.state.errors.length > 0) {
      const errorCount = this.state.errors.filter(e => e.severity === 'error').length;
      const warningCount = this.state.errors.filter(e => e.severity === 'warning').length;
      if (errorCount > 0) parts.push(`${errorCount} errors`);
      if (warningCount > 0) parts.push(`${warningCount} warnings`);
    }
    
    return parts.join(', ');
  }

  // Add file to recent files list
  private addToRecentFiles(file: WorkspaceFile): void {
    // Remove if already exists
    this.state.recentFiles = this.state.recentFiles.filter(f => f.path !== file.path);
    
    // Add to beginning
    this.state.recentFiles.unshift(file);
    
    // Keep only last 20 files
    if (this.state.recentFiles.length > 20) {
      this.state.recentFiles = this.state.recentFiles.slice(0, 20);
    }
  }

  // Queue update to avoid race conditions
  private queueUpdate(update: () => void): void {
    this.updateQueue.push(update);
    
    if (!this.isProcessingQueue) {
      this.processUpdateQueue();
    }
  }

  // Process queued updates
  private async processUpdateQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift();
      if (update) {
        try {
          update();
        } catch (error) {
          console.error('Error processing context update:', error);
        }
      }
      
      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    this.isProcessingQueue = false;
  }

  // Cleanup resources
  destroy(): void {
    this.fileWatchers.forEach(watcher => {
      if (watcher && typeof watcher.close === 'function') {
        watcher.close();
      }
    });
    this.fileWatchers.clear();
    this.removeAllListeners();
  }
}

// Global instance
let globalContextManager: WorkspaceContextManager | null = null;

export function getWorkspaceContextManager(): WorkspaceContextManager {
  if (!globalContextManager) {
    globalContextManager = new WorkspaceContextManager();
  }
  return globalContextManager;
}

export function createWorkspaceContextManager(initialState?: Partial<WorkspaceState>): WorkspaceContextManager {
  return new WorkspaceContextManager(initialState);
}
