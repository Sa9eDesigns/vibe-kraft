'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  WorkspaceContextManager, 
  WorkspaceState, 
  WorkspaceFile, 
  ProjectContext,
  ContextSnapshot,
  getWorkspaceContextManager 
} from '@/lib/ai/workspace-context-manager';

/**
 * React hook for workspace context management
 * Provides reactive access to workspace state and context updates
 */

export interface UseWorkspaceContextOptions {
  autoSnapshot?: boolean;
  snapshotInterval?: number;
  trackFileChanges?: boolean;
  trackTerminalHistory?: boolean;
}

export interface UseWorkspaceContextReturn {
  // State
  state: WorkspaceState;
  isLoading: boolean;
  error: string | null;
  
  // Context
  aiContext: ReturnType<WorkspaceContextManager['getAIContext']>;
  snapshots: ContextSnapshot[];
  
  // Actions
  updateCurrentDirectory: (path: string) => void;
  updateFile: (file: WorkspaceFile) => void;
  removeFile: (path: string) => void;
  updateProjectContext: (context: ProjectContext) => void;
  addTerminalCommand: (command: string) => void;
  addError: (error: WorkspaceState['errors'][0]) => void;
  clearFileErrors: (filePath: string) => void;
  createSnapshot: (userIntent?: string, aiResponse?: string) => ContextSnapshot;
  
  // Utilities
  getRelevantFilesForPrompt: () => WorkspaceFile[];
  getContextSummary: () => string;
  exportContext: () => string;
  importContext: (contextData: string) => void;
  
  // Event handlers
  onFileChange: (callback: (file: WorkspaceFile) => void) => () => void;
  onDirectoryChange: (callback: (path: string) => void) => () => void;
  onError: (callback: (error: WorkspaceState['errors'][0]) => void) => () => void;
}

export function useWorkspaceContext(options: UseWorkspaceContextOptions = {}): UseWorkspaceContextReturn {
  const {
    autoSnapshot = true,
    snapshotInterval = 30000, // 30 seconds
    trackFileChanges = true,
    trackTerminalHistory = true
  } = options;

  const [state, setState] = useState<WorkspaceState>({
    currentDirectory: '/',
    openFiles: [],
    recentFiles: [],
    terminalHistory: [],
    activeProcesses: [],
    errors: []
  });
  
  const [aiContext, setAiContext] = useState<ReturnType<WorkspaceContextManager['getAIContext']>>({
    workspace: state,
    summary: '',
    relevantFiles: [],
    recentActivity: []
  });
  
  const [snapshots, setSnapshots] = useState<ContextSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const contextManagerRef = useRef<WorkspaceContextManager | null>(null);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize context manager
  useEffect(() => {
    try {
      contextManagerRef.current = getWorkspaceContextManager();
      
      // Set initial state
      setState(contextManagerRef.current.getState());
      setAiContext(contextManagerRef.current.getAIContext());
      setSnapshots(contextManagerRef.current.getRecentSnapshots());
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize workspace context');
      setIsLoading(false);
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const manager = contextManagerRef.current;
    if (!manager) return;

    const handleStateUpdate = () => {
      setState(manager.getState());
      setAiContext(manager.getAIContext());
    };

    const handleSnapshotCreated = (snapshot: ContextSnapshot) => {
      setSnapshots(prev => [...prev.slice(-49), snapshot]); // Keep last 50
    };

    // Subscribe to events
    manager.on('directoryChanged', handleStateUpdate);
    manager.on('fileUpdated', handleStateUpdate);
    manager.on('fileRemoved', handleStateUpdate);
    manager.on('projectContextUpdated', handleStateUpdate);
    manager.on('terminalCommandAdded', handleStateUpdate);
    manager.on('gitStatusUpdated', handleStateUpdate);
    manager.on('errorAdded', handleStateUpdate);
    manager.on('errorsCleared', handleStateUpdate);
    manager.on('snapshotCreated', handleSnapshotCreated);

    return () => {
      manager.removeListener('directoryChanged', handleStateUpdate);
      manager.removeListener('fileUpdated', handleStateUpdate);
      manager.removeListener('fileRemoved', handleStateUpdate);
      manager.removeListener('projectContextUpdated', handleStateUpdate);
      manager.removeListener('terminalCommandAdded', handleStateUpdate);
      manager.removeListener('gitStatusUpdated', handleStateUpdate);
      manager.removeListener('errorAdded', handleStateUpdate);
      manager.removeListener('errorsCleared', handleStateUpdate);
      manager.removeListener('snapshotCreated', handleSnapshotCreated);
    };
  }, []);

  // Auto-snapshot functionality
  useEffect(() => {
    if (!autoSnapshot || !contextManagerRef.current) return;

    snapshotIntervalRef.current = setInterval(() => {
      if (contextManagerRef.current) {
        contextManagerRef.current.createSnapshot('auto-snapshot');
      }
    }, snapshotInterval);

    return () => {
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }
    };
  }, [autoSnapshot, snapshotInterval]);

  // Action handlers
  const updateCurrentDirectory = useCallback((path: string) => {
    contextManagerRef.current?.updateCurrentDirectory(path);
  }, []);

  const updateFile = useCallback((file: WorkspaceFile) => {
    if (trackFileChanges) {
      contextManagerRef.current?.updateFile(file);
    }
  }, [trackFileChanges]);

  const removeFile = useCallback((path: string) => {
    contextManagerRef.current?.removeFile(path);
  }, []);

  const updateProjectContext = useCallback((context: ProjectContext) => {
    contextManagerRef.current?.updateProjectContext(context);
  }, []);

  const addTerminalCommand = useCallback((command: string) => {
    if (trackTerminalHistory) {
      contextManagerRef.current?.addTerminalCommand(command);
    }
  }, [trackTerminalHistory]);

  const addError = useCallback((error: WorkspaceState['errors'][0]) => {
    contextManagerRef.current?.addError(error);
  }, []);

  const clearFileErrors = useCallback((filePath: string) => {
    contextManagerRef.current?.clearFileErrors(filePath);
  }, []);

  const createSnapshot = useCallback((userIntent?: string, aiResponse?: string) => {
    if (!contextManagerRef.current) {
      throw new Error('Context manager not initialized');
    }
    return contextManagerRef.current.createSnapshot(userIntent, aiResponse);
  }, []);

  // Utility functions
  const getRelevantFilesForPrompt = useCallback((): WorkspaceFile[] => {
    return aiContext.relevantFiles.slice(0, 10); // Limit to prevent token overflow
  }, [aiContext.relevantFiles]);

  const getContextSummary = useCallback((): string => {
    return aiContext.summary;
  }, [aiContext.summary]);

  const exportContext = useCallback((): string => {
    const exportData = {
      state,
      snapshots: snapshots.slice(-10), // Export last 10 snapshots
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  }, [state, snapshots]);

  const importContext = useCallback((contextData: string) => {
    try {
      const data = JSON.parse(contextData);
      
      if (data.version !== '1.0') {
        throw new Error('Unsupported context data version');
      }
      
      // Import state
      if (data.state && contextManagerRef.current) {
        const manager = contextManagerRef.current;
        
        if (data.state.currentDirectory) {
          manager.updateCurrentDirectory(data.state.currentDirectory);
        }
        
        if (data.state.projectContext) {
          manager.updateProjectContext(data.state.projectContext);
        }
        
        if (data.state.openFiles) {
          data.state.openFiles.forEach((file: WorkspaceFile) => {
            manager.updateFile(file);
          });
        }
      }
      
      // Import snapshots
      if (data.snapshots) {
        setSnapshots(data.snapshots);
      }
      
    } catch (err) {
      throw new Error(`Failed to import context: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  // Event handler utilities
  const onFileChange = useCallback((callback: (file: WorkspaceFile) => void) => {
    const manager = contextManagerRef.current;
    if (!manager) return () => {};

    manager.on('fileUpdated', callback);
    return () => manager.removeListener('fileUpdated', callback);
  }, []);

  const onDirectoryChange = useCallback((callback: (path: string) => void) => {
    const manager = contextManagerRef.current;
    if (!manager) return () => {};

    manager.on('directoryChanged', callback);
    return () => manager.removeListener('directoryChanged', callback);
  }, []);

  const onError = useCallback((callback: (error: WorkspaceState['errors'][0]) => void) => {
    const manager = contextManagerRef.current;
    if (!manager) return () => {};

    manager.on('errorAdded', callback);
    return () => manager.removeListener('errorAdded', callback);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    state,
    isLoading,
    error,
    
    // Context
    aiContext,
    snapshots,
    
    // Actions
    updateCurrentDirectory,
    updateFile,
    removeFile,
    updateProjectContext,
    addTerminalCommand,
    addError,
    clearFileErrors,
    createSnapshot,
    
    // Utilities
    getRelevantFilesForPrompt,
    getContextSummary,
    exportContext,
    importContext,
    
    // Event handlers
    onFileChange,
    onDirectoryChange,
    onError
  };
}

// Specialized hooks for specific use cases
export function useWorkspaceFiles() {
  const { state, updateFile, removeFile, onFileChange } = useWorkspaceContext({
    trackFileChanges: true,
    trackTerminalHistory: false
  });
  
  return {
    openFiles: state.openFiles,
    recentFiles: state.recentFiles,
    updateFile,
    removeFile,
    onFileChange
  };
}

export function useWorkspaceTerminal() {
  const { state, addTerminalCommand } = useWorkspaceContext({
    trackFileChanges: false,
    trackTerminalHistory: true
  });
  
  return {
    terminalHistory: state.terminalHistory,
    activeProcesses: state.activeProcesses,
    addTerminalCommand
  };
}

export function useWorkspaceErrors() {
  const { state, addError, clearFileErrors, onError } = useWorkspaceContext();
  
  return {
    errors: state.errors,
    addError,
    clearFileErrors,
    onError
  };
}
