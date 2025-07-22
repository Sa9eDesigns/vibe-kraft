/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePyodide } from '@/components/pyodide/hooks/use-pyodide';

// Mock the core modules
jest.mock('@/components/pyodide/core/pyodide-runtime');
jest.mock('@/components/pyodide/core/pyodide-filesystem');
jest.mock('@/components/pyodide/core/pyodide-packages');
jest.mock('@/components/pyodide/core/pyodide-state-manager');

const mockRuntime = {
  initialize: jest.fn(),
  runPython: jest.fn(),
  cleanup: jest.fn(),
  initialized: true,
  loading: false
};

const mockFileSystem = {
  createFile: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  deleteFile: jest.fn(),
  listDirectory: jest.fn(),
  uploadFile: jest.fn(),
  downloadFile: jest.fn(),
  loadFromDatabase: jest.fn()
};

const mockPackageManager = {
  initialize: jest.fn(),
  installPackage: jest.fn(),
  uninstallPackage: jest.fn(),
  searchPackages: jest.fn(),
  getInstalledPackages: jest.fn(() => Promise.resolve([]))
};

const mockStateManager = {
  initialize: jest.fn(),
  saveState: jest.fn(),
  loadState: jest.fn(),
  exportState: jest.fn(),
  importState: jest.fn(),
  markDirty: jest.fn(),
  cleanup: jest.fn()
};

// Mock constructors
const { PyodideRuntime } = require('@/components/pyodide/core/pyodide-runtime');
const { PyodideFileSystem } = require('@/components/pyodide/core/pyodide-filesystem');
const { PyodidePackageManager } = require('@/components/pyodide/core/pyodide-packages');
const { PyodideStateManager } = require('@/components/pyodide/core/pyodide-state-manager');

PyodideRuntime.mockImplementation(() => mockRuntime);
PyodideFileSystem.mockImplementation(() => mockFileSystem);
PyodidePackageManager.mockImplementation(() => mockPackageManager);
PyodideStateManager.mockImplementation(() => mockStateManager);

describe('usePyodide', () => {
  const workspaceId = 'test-workspace-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize automatically when autoInitialize is true', async () => {
      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(mockRuntime.initialize).toHaveBeenCalled();
      expect(mockFileSystem.loadFromDatabase).toHaveBeenCalled();
      expect(mockPackageManager.initialize).toHaveBeenCalled();
      expect(mockStateManager.initialize).toHaveBeenCalled();
    });

    it('should not initialize automatically when autoInitialize is false', () => {
      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: false })
      );

      expect(result.current.isInitialized).toBe(false);
      expect(mockRuntime.initialize).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockRuntime.initialize.mockRejectedValue(error);

      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.error).toBe(error.message);
      });

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should prevent multiple initializations', async () => {
      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: false })
      );

      await act(async () => {
        await result.current.initialize();
        await result.current.initialize();
      });

      expect(mockRuntime.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('Python execution', () => {
    it('should execute Python code', async () => {
      const mockResult = {
        success: true,
        result: 'Hello, World!',
        output: 'Hello, World!\n',
        stderr: ''
      };
      mockRuntime.runPython.mockResolvedValue(mockResult);

      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let executionResult;
      await act(async () => {
        executionResult = await result.current.runPython('print("Hello, World!")');
      });

      expect(executionResult).toEqual(mockResult);
      expect(mockRuntime.runPython).toHaveBeenCalledWith('print("Hello, World!")');
    });

    it('should handle Python execution errors', async () => {
      const mockResult = {
        success: false,
        error: 'NameError: name "undefined_var" is not defined',
        output: '',
        stderr: 'NameError: name "undefined_var" is not defined'
      };
      mockRuntime.runPython.mockResolvedValue(mockResult);

      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let executionResult;
      await act(async () => {
        executionResult = await result.current.runPython('print(undefined_var)');
      });

      expect(executionResult).toEqual(mockResult);
    });

    it('should throw error when not initialized', async () => {
      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: false })
      );

      await expect(result.current.runPython('print("Hello")')).rejects.toThrow(
        'Pyodide runtime not initialized'
      );
    });
  });

  describe('file operations', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });

    it('should create files', async () => {
      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.createFile('test.py', 'print("Hello")');
      });

      expect(mockFileSystem.createFile).toHaveBeenCalledWith('test.py', 'print("Hello")');
    });

    it('should read files', async () => {
      const content = 'print("Hello, World!")';
      mockFileSystem.readFile.mockResolvedValue(content);

      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let fileContent;
      await act(async () => {
        fileContent = await result.current.readFile('test.py');
      });

      expect(fileContent).toBe(content);
      expect(mockFileSystem.readFile).toHaveBeenCalledWith('test.py');
    });

    it('should write files', async () => {
      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.writeFile('test.py', 'print("Updated")');
      });

      expect(mockFileSystem.writeFile).toHaveBeenCalledWith('test.py', 'print("Updated")');
    });

    it('should delete files', async () => {
      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.deleteFile('test.py');
      });

      expect(mockFileSystem.delete).toHaveBeenCalledWith('test.py');
    });

    it('should list directories', async () => {
      const files = [
        { name: 'test.py', type: 'file', size: 100, modified: new Date() }
      ];
      mockFileSystem.listDirectory.mockResolvedValue(files);

      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let directoryFiles;
      await act(async () => {
        directoryFiles = await result.current.listDirectory();
      });

      expect(directoryFiles).toEqual(files);
      expect(mockFileSystem.listDirectory).toHaveBeenCalled();
    });
  });

  describe('package management', () => {
    it('should install packages', async () => {
      mockPackageManager.installPackage.mockResolvedValue(true);
      mockPackageManager.getInstalledPackages.mockResolvedValue([
        { name: 'numpy', version: '1.21.0', installed: true }
      ]);

      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let success;
      await act(async () => {
        success = await result.current.installPackage('numpy');
      });

      expect(success).toBe(true);
      expect(mockPackageManager.installPackage).toHaveBeenCalledWith('numpy', undefined);
    });

    it('should uninstall packages', async () => {
      mockPackageManager.uninstallPackage.mockResolvedValue(true);
      mockPackageManager.getInstalledPackages.mockResolvedValue([]);

      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let success;
      await act(async () => {
        success = await result.current.uninstallPackage('numpy');
      });

      expect(success).toBe(true);
      expect(mockPackageManager.uninstallPackage).toHaveBeenCalledWith('numpy');
    });

    it('should search packages', async () => {
      const searchResults = [
        { name: 'numpy', version: 'latest', description: 'Scientific computing' }
      ];
      mockPackageManager.searchPackages.mockResolvedValue(searchResults);

      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let results;
      await act(async () => {
        results = await result.current.searchPackages('numpy');
      });

      expect(results).toEqual(searchResults);
      expect(mockPackageManager.searchPackages).toHaveBeenCalledWith('numpy');
    });
  });

  describe('state management', () => {
    it('should save workspace state', async () => {
      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.saveWorkspace();
      });

      expect(mockStateManager.saveState).toHaveBeenCalled();
    });

    it('should load workspace state', async () => {
      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.loadWorkspace();
      });

      expect(mockStateManager.loadState).toHaveBeenCalled();
    });

    it('should export workspace state', async () => {
      const stateJson = '{"workspaceId": "test"}';
      mockStateManager.exportState.mockResolvedValue(stateJson);

      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let exportedState;
      await act(async () => {
        exportedState = await result.current.exportWorkspace();
      });

      expect(exportedState).toBe(stateJson);
      expect(mockStateManager.exportState).toHaveBeenCalled();
    });

    it('should import workspace state', async () => {
      const stateJson = '{"workspaceId": "test"}';

      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.importWorkspace(stateJson);
      });

      expect(mockStateManager.importState).toHaveBeenCalledWith(stateJson);
    });

    it('should mark state as dirty', async () => {
      const { result } = renderHook(() => 
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      act(() => {
        result.current.markStateDirty();
      });

      expect(mockStateManager.markDirty).toHaveBeenCalled();
    });
  });

  describe('output management', () => {
    it('should capture and manage output', async () => {
      const { result } = renderHook(() =>
        usePyodide({
          workspaceId,
          autoInitialize: true,
          config: {
            stdout: (text) => result.current.addOutput(text, 'stdout'),
            stderr: (text) => result.current.addOutput(text, 'stderr')
          }
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      act(() => {
        result.current.addOutput('Hello from Python', 'stdout');
        result.current.addOutput('Error message', 'stderr');
      });

      expect(result.current.output).toContain('Hello from Python');
      expect(result.current.output).toContain('ERROR: Error message');
    });

    it('should clear output', async () => {
      const { result } = renderHook(() =>
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      act(() => {
        result.current.addOutput('Test output');
        result.current.clearOutput();
      });

      expect(result.current.output).toHaveLength(0);
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      unmount();

      expect(mockRuntime.cleanup).toHaveBeenCalled();
    });

    it('should cleanup state manager', async () => {
      const { result } = renderHook(() =>
        usePyodide({ workspaceId, autoInitialize: true })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.cleanup();
      });

      expect(mockStateManager.cleanup).toHaveBeenCalled();
      expect(mockRuntime.cleanup).toHaveBeenCalled();
    });
  });
});
