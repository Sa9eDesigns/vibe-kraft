/**
 * Pyodide React Hook
 * React hook for managing Pyodide runtime in components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PyodideRuntime, PyodideConfig, PythonExecutionResult } from '../core/pyodide-runtime';
import { PyodideFileSystem, FileInfo } from '../core/pyodide-filesystem';
import { PyodidePackageManager, PackageInfo, InstallationProgress } from '../core/pyodide-packages';
import { PyodideStateManager, PyodideWorkspaceState } from '../core/pyodide-state-manager';

export interface UsePyodideOptions {
  workspaceId: string;
  config?: PyodideConfig;
  autoInitialize?: boolean;
}

export interface UsePyodideReturn {
  // Runtime state
  runtime: PyodideRuntime | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Core operations
  initialize: () => Promise<void>;
  runPython: (code: string) => Promise<PythonExecutionResult>;
  cleanup: () => Promise<void>;

  // State management
  stateManager: PyodideStateManager | null;
  saveWorkspace: () => Promise<void>;
  loadWorkspace: () => Promise<void>;
  exportWorkspace: () => Promise<string>;
  importWorkspace: (stateJson: string) => Promise<void>;
  markStateDirty: () => void;

  // File system operations
  fileSystem: PyodideFileSystem | null;
  createFile: (path: string, content?: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  listDirectory: (path?: string) => Promise<FileInfo[]>;
  uploadFile: (file: File, targetPath?: string) => Promise<string>;
  downloadFile: (path: string) => Promise<Blob>;

  // Package management
  packageManager: PyodidePackageManager | null;
  installedPackages: PackageInfo[];
  installPackage: (packageName: string, onProgress?: (progress: InstallationProgress) => void) => Promise<boolean>;
  uninstallPackage: (packageName: string) => Promise<boolean>;
  searchPackages: (query: string) => Promise<any[]>;
  refreshPackages: () => Promise<void>;

  // Console integration
  output: string[];
  clearOutput: () => void;
  addOutput: (text: string, type?: 'stdout' | 'stderr' | 'info') => void;

  // Workspace state
  saveWorkspace: () => Promise<void>;
  loadWorkspace: () => Promise<void>;
}

export function usePyodide({
  workspaceId,
  config = {},
  autoInitialize = true
}: UsePyodideOptions): UsePyodideReturn {
  const [runtime, setRuntime] = useState<PyodideRuntime | null>(null);
  const [fileSystem, setFileSystem] = useState<PyodideFileSystem | null>(null);
  const [packageManager, setPackageManager] = useState<PyodidePackageManager | null>(null);
  const [stateManager, setStateManager] = useState<PyodideStateManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [installedPackages, setInstalledPackages] = useState<PackageInfo[]>([]);

  const initializationRef = useRef<Promise<void> | null>(null);

  // Initialize Pyodide runtime
  const initialize = useCallback(async () => {
    if (initializationRef.current) {
      return initializationRef.current;
    }

    if (isInitialized || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const initPromise = (async () => {
      try {
        // Create runtime with output callbacks
        const pyodideRuntime = new PyodideRuntime({
          ...config,
          stdout: (text: string) => {
            setOutput(prev => [...prev.slice(-999), text]); // Keep last 1000 lines
            config.stdout?.(text);
          },
          stderr: (text: string) => {
            setOutput(prev => [...prev.slice(-999), `ERROR: ${text}`]);
            config.stderr?.(text);
          }
        });

        // Initialize runtime
        await pyodideRuntime.initialize();

        // Create file system manager
        const fs = new PyodideFileSystem(pyodideRuntime, workspaceId);

        // Load existing files from database
        await fs.loadFromDatabase();

        // Create package manager
        const pkgManager = new PyodidePackageManager(pyodideRuntime);
        await pkgManager.initialize();

        // Get initial package list
        const packages = await pkgManager.getInstalledPackages();

        // Create state manager
        const stateMgr = new PyodideStateManager(workspaceId, pyodideRuntime, fs, pkgManager);
        await stateMgr.initialize();

        // Update state
        setRuntime(pyodideRuntime);
        setFileSystem(fs);
        setPackageManager(pkgManager);
        setStateManager(stateMgr);
        setInstalledPackages(packages);
        setIsInitialized(true);
        setError(null);

        // Add welcome message
        setOutput(prev => [
          ...prev,
          'Python workspace initialized successfully!',
          'Type Python code to get started.',
          ''
        ]);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Pyodide';
        setError(errorMessage);
        console.error('Pyodide initialization error:', err);
      } finally {
        setIsLoading(false);
        initializationRef.current = null;
      }
    })();

    initializationRef.current = initPromise;
    return initPromise;
  }, [workspaceId, config, isInitialized, isLoading]);

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && !isInitialized && !isLoading) {
      initialize();
    }
  }, [autoInitialize, initialize, isInitialized, isLoading]);

  // Run Python code
  const runPython = useCallback(async (code: string): Promise<PythonExecutionResult> => {
    if (!runtime || !isInitialized) {
      throw new Error('Pyodide runtime not initialized');
    }

    try {
      const result = await runtime.runPython(code);
      
      // Add command to output
      setOutput(prev => [
        ...prev.slice(-999),
        `>>> ${code}`,
        ...(result.output ? result.output.split('\n').filter(line => line.trim()) : []),
        ...(result.stderr ? result.stderr.split('\n').filter(line => line.trim()).map(line => `ERROR: ${line}`) : []),
        ...(result.result !== undefined && result.result !== null ? [String(result.result)] : [])
      ]);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Execution failed';
      setOutput(prev => [...prev.slice(-999), `ERROR: ${errorMessage}`]);
      throw error;
    }
  }, [runtime, isInitialized]);

  // File system operations
  const createFile = useCallback(async (path: string, content: string = '') => {
    if (!fileSystem) throw new Error('File system not initialized');
    await fileSystem.createFile(path, content);
  }, [fileSystem]);

  const readFile = useCallback(async (path: string) => {
    if (!fileSystem) throw new Error('File system not initialized');
    return await fileSystem.readFile(path);
  }, [fileSystem]);

  const writeFile = useCallback(async (path: string, content: string) => {
    if (!fileSystem) throw new Error('File system not initialized');
    await fileSystem.writeFile(path, content);
  }, [fileSystem]);

  const deleteFile = useCallback(async (path: string) => {
    if (!fileSystem) throw new Error('File system not initialized');
    await fileSystem.delete(path);
  }, [fileSystem]);

  const listDirectory = useCallback(async (path?: string) => {
    if (!fileSystem) throw new Error('File system not initialized');
    return await fileSystem.listDirectory(path);
  }, [fileSystem]);

  const uploadFile = useCallback(async (file: File, targetPath?: string) => {
    if (!fileSystem) throw new Error('File system not initialized');
    return await fileSystem.uploadFile(file, targetPath);
  }, [fileSystem]);

  const downloadFile = useCallback(async (path: string) => {
    if (!fileSystem) throw new Error('File system not initialized');
    return await fileSystem.downloadFile(path);
  }, [fileSystem]);

  // Package management operations
  const installPackage = useCallback(async (
    packageName: string, 
    onProgress?: (progress: InstallationProgress) => void
  ) => {
    if (!packageManager) throw new Error('Package manager not initialized');
    
    const success = await packageManager.installPackage(packageName, undefined, onProgress);
    
    if (success) {
      // Refresh package list
      const packages = await packageManager.getInstalledPackages();
      setInstalledPackages(packages);
    }
    
    return success;
  }, [packageManager]);

  const uninstallPackage = useCallback(async (packageName: string) => {
    if (!packageManager) throw new Error('Package manager not initialized');
    
    const success = await packageManager.uninstallPackage(packageName);
    
    if (success) {
      // Refresh package list
      const packages = await packageManager.getInstalledPackages();
      setInstalledPackages(packages);
    }
    
    return success;
  }, [packageManager]);

  const searchPackages = useCallback(async (query: string) => {
    if (!packageManager) throw new Error('Package manager not initialized');
    return await packageManager.searchPackages(query);
  }, [packageManager]);

  const refreshPackages = useCallback(async () => {
    if (!packageManager) return;
    const packages = await packageManager.getInstalledPackages();
    setInstalledPackages(packages);
  }, [packageManager]);

  // Output management
  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  const addOutput = useCallback((text: string, type: 'stdout' | 'stderr' | 'info' = 'stdout') => {
    const prefix = type === 'stderr' ? 'ERROR: ' : type === 'info' ? 'INFO: ' : '';
    setOutput(prev => [...prev.slice(-999), `${prefix}${text}`]);
  }, []);

  // Workspace state management
  const saveWorkspace = useCallback(async () => {
    if (!stateManager) return;
    await stateManager.saveState();
    if (fileSystem) {
      await fileSystem.sync();
    }
  }, [stateManager, fileSystem]);

  const loadWorkspace = useCallback(async () => {
    if (!stateManager) return;
    await stateManager.loadState();
    console.log('Workspace state loaded from database');
  }, [stateManager]);

  const exportWorkspace = useCallback(async () => {
    if (!stateManager) throw new Error('State manager not initialized');
    return await stateManager.exportState();
  }, [stateManager]);

  const importWorkspace = useCallback(async (stateJson: string) => {
    if (!stateManager) throw new Error('State manager not initialized');
    await stateManager.importState(stateJson);
    // Refresh packages after import
    if (packageManager) {
      const packages = await packageManager.getInstalledPackages();
      setInstalledPackages(packages);
    }
  }, [stateManager, packageManager]);

  const markStateDirty = useCallback(() => {
    if (stateManager) {
      stateManager.markDirty();
    }
  }, [stateManager]);

  // Cleanup
  const cleanup = useCallback(async () => {
    if (stateManager) {
      await stateManager.cleanup();
    }
    if (runtime) {
      await runtime.cleanup();
      setRuntime(null);
      setFileSystem(null);
      setPackageManager(null);
      setStateManager(null);
      setIsInitialized(false);
      setOutput([]);
      setInstalledPackages([]);
    }
  }, [runtime, stateManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (runtime) {
        runtime.cleanup();
      }
    };
  }, [runtime]);

  return {
    // Runtime state
    runtime,
    isInitialized,
    isLoading,
    error,

    // Core operations
    initialize,
    runPython,
    cleanup,

    // File system operations
    fileSystem,
    createFile,
    readFile,
    writeFile,
    deleteFile,
    listDirectory,
    uploadFile,
    downloadFile,

    // Package management
    packageManager,
    installedPackages,
    installPackage,
    uninstallPackage,
    searchPackages,
    refreshPackages,

    // Console integration
    output,
    clearOutput,
    addOutput,

    // Workspace state
    stateManager,
    saveWorkspace,
    loadWorkspace,
    exportWorkspace,
    importWorkspace,
    markStateDirty
  };
}
