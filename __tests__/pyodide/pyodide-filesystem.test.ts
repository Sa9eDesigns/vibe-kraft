/**
 * @jest-environment jsdom
 */

import { PyodideFileSystem } from '@/components/pyodide/core/pyodide-filesystem';
import { PyodideRuntime } from '@/components/pyodide/core/pyodide-runtime';

// Mock fetch
global.fetch = jest.fn();

// Mock PyodideRuntime
const mockRuntime = {
  initialized: true,
  writeFile: jest.fn(),
  readFile: jest.fn(),
  exists: jest.fn(),
  runPython: jest.fn(),
  syncFileSystem: jest.fn()
} as unknown as PyodideRuntime;

describe('PyodideFileSystem', () => {
  let fileSystem: PyodideFileSystem;
  const workspaceId = 'test-workspace-id';

  beforeEach(() => {
    jest.clearAllMocks();
    fileSystem = new PyodideFileSystem(mockRuntime, workspaceId);
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  describe('file operations', () => {
    it('should create a file', async () => {
      const path = 'test.py';
      const content = 'print("Hello, World!")';

      await fileSystem.createFile(path, content);

      expect(mockRuntime.writeFile).toHaveBeenCalledWith('/workspace/test.py', content);
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/workspaces/${workspaceId}/pyodide/files`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path,
            content,
            isDirectory: false
          })
        })
      );
    });

    it('should create a directory', async () => {
      const path = 'my-folder';
      mockRuntime.runPython.mockResolvedValue({ success: true });

      await fileSystem.createDirectory(path);

      expect(mockRuntime.runPython).toHaveBeenCalledWith(
        expect.stringContaining(`os.makedirs('/workspace/my-folder', exist_ok=True)`)
      );
      expect(mockRuntime.syncFileSystem).toHaveBeenCalled();
    });

    it('should read a file', async () => {
      const path = 'test.py';
      const content = 'print("Hello, World!")';
      mockRuntime.readFile.mockReturnValue(content);

      const result = await fileSystem.readFile(path);

      expect(result).toBe(content);
      expect(mockRuntime.readFile).toHaveBeenCalledWith('/workspace/test.py');
    });

    it('should write a file', async () => {
      const path = 'test.py';
      const content = 'print("Updated content")';

      await fileSystem.writeFile(path, content);

      expect(mockRuntime.writeFile).toHaveBeenCalledWith('/workspace/test.py', content);
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/workspaces/${workspaceId}/pyodide/files/test.py`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ content })
        })
      );
    });

    it('should delete a file', async () => {
      const path = 'test.py';
      mockRuntime.runPython.mockResolvedValue({ success: true });

      await fileSystem.delete(path);

      expect(mockRuntime.runPython).toHaveBeenCalledWith(
        expect.stringContaining(`os.remove(path)`)
      );
      expect(mockRuntime.syncFileSystem).toHaveBeenCalled();
    });

    it('should move a file', async () => {
      const fromPath = 'old.py';
      const toPath = 'new.py';
      mockRuntime.runPython.mockResolvedValue({ success: true });

      await fileSystem.move(fromPath, toPath);

      expect(mockRuntime.runPython).toHaveBeenCalledWith(
        expect.stringContaining('shutil.move(from_path, to_path)')
      );
      expect(mockRuntime.syncFileSystem).toHaveBeenCalled();
    });

    it('should copy a file', async () => {
      const fromPath = 'original.py';
      const toPath = 'copy.py';
      mockRuntime.runPython.mockResolvedValue({ success: true });

      await fileSystem.copy(fromPath, toPath);

      expect(mockRuntime.runPython).toHaveBeenCalledWith(
        expect.stringContaining('shutil.copy2(from_path, to_path)')
      );
      expect(mockRuntime.syncFileSystem).toHaveBeenCalled();
    });
  });

  describe('directory listing', () => {
    it('should list directory contents', async () => {
      const mockFiles = [
        {
          name: 'test.py',
          path: 'test.py',
          type: 'file',
          size: 100,
          modified: '2023-01-01T00:00:00.000Z'
        },
        {
          name: 'folder',
          path: 'folder',
          type: 'directory',
          size: 0,
          modified: '2023-01-01T00:00:00.000Z'
        }
      ];

      mockRuntime.runPython.mockResolvedValue({
        success: true,
        result: JSON.stringify(mockFiles)
      });

      const result = await fileSystem.listDirectory();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('test.py');
      expect(result[0].type).toBe('file');
      expect(result[1].name).toBe('folder');
      expect(result[1].type).toBe('directory');
    });

    it('should handle empty directories', async () => {
      mockRuntime.runPython.mockResolvedValue({
        success: true,
        result: JSON.stringify([])
      });

      const result = await fileSystem.listDirectory();

      expect(result).toHaveLength(0);
    });
  });

  describe('file information', () => {
    it('should get file info', async () => {
      const mockFileInfo = {
        name: 'test.py',
        path: 'test.py',
        type: 'file',
        size: 100,
        modified: '2023-01-01T00:00:00.000Z'
      };

      mockRuntime.runPython.mockResolvedValue({
        success: true,
        result: JSON.stringify(mockFileInfo)
      });

      const result = await fileSystem.getInfo('test.py');

      expect(result).toBeTruthy();
      expect(result?.name).toBe('test.py');
      expect(result?.type).toBe('file');
    });

    it('should return null for non-existent files', async () => {
      mockRuntime.runPython.mockResolvedValue({
        success: true,
        result: 'None'
      });

      const result = await fileSystem.getInfo('nonexistent.py');

      expect(result).toBeNull();
    });

    it('should check file existence', async () => {
      mockRuntime.exists.mockReturnValue(true);

      const exists = await fileSystem.exists('test.py');

      expect(exists).toBe(true);
      expect(mockRuntime.exists).toHaveBeenCalledWith('/workspace/test.py');
    });
  });

  describe('file system statistics', () => {
    it('should get file system stats', async () => {
      const mockStats = {
        totalFiles: 5,
        totalSize: 1024,
        directories: 2,
        lastModified: '2023-01-01T00:00:00.000Z'
      };

      mockRuntime.runPython.mockResolvedValue({
        success: true,
        result: JSON.stringify(mockStats)
      });

      const result = await fileSystem.getStats();

      expect(result.totalFiles).toBe(5);
      expect(result.totalSize).toBe(1024);
      expect(result.directories).toBe(2);
    });
  });

  describe('file upload/download', () => {
    it('should upload a file', async () => {
      const mockFile = new File(['print("Hello")'], 'test.py', { type: 'text/plain' });
      
      const result = await fileSystem.uploadFile(mockFile);

      expect(result).toBe('test.py');
      expect(mockRuntime.writeFile).toHaveBeenCalledWith('/workspace/test.py', 'print("Hello")');
    });

    it('should upload a file to specific path', async () => {
      const mockFile = new File(['print("Hello")'], 'test.py', { type: 'text/plain' });
      const targetPath = 'scripts/test.py';
      
      const result = await fileSystem.uploadFile(mockFile, targetPath);

      expect(result).toBe(targetPath);
      expect(mockRuntime.writeFile).toHaveBeenCalledWith('/workspace/scripts/test.py', 'print("Hello")');
    });

    it('should download a file', async () => {
      const content = 'print("Hello, World!")';
      mockRuntime.readFile.mockReturnValue(content);

      const blob = await fileSystem.downloadFile('test.py');

      expect(blob).toBeInstanceOf(Blob);
      expect(mockRuntime.readFile).toHaveBeenCalledWith('/workspace/test.py');
    });
  });

  describe('search functionality', () => {
    it('should search files by name', async () => {
      const mockResults = [
        {
          name: 'test.py',
          path: 'test.py',
          type: 'file',
          size: 100,
          modified: '2023-01-01T00:00:00.000Z'
        }
      ];

      mockRuntime.runPython.mockResolvedValue({
        success: true,
        result: JSON.stringify(mockResults)
      });

      const results = await fileSystem.search('test');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('test.py');
    });

    it('should search files by content', async () => {
      const mockResults = [
        {
          name: 'hello.py',
          path: 'hello.py',
          type: 'file',
          size: 50,
          modified: '2023-01-01T00:00:00.000Z'
        }
      ];

      mockRuntime.runPython.mockResolvedValue({
        success: true,
        result: JSON.stringify(mockResults)
      });

      const results = await fileSystem.search('Hello', true);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('hello.py');
    });
  });

  describe('database synchronization', () => {
    it('should sync to database on file creation', async () => {
      await fileSystem.createFile('test.py', 'print("Hello")');

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/workspaces/${workspaceId}/pyodide/files`,
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should handle database sync errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      });

      // Should not throw error, just log warning
      await expect(fileSystem.createFile('test.py', 'print("Hello")')).resolves.not.toThrow();
    });

    it('should load files from database', async () => {
      const mockFiles = [
        {
          path: 'test.py',
          content: 'print("Hello")',
          type: 'file'
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ files: mockFiles })
      });

      await fileSystem.loadFromDatabase();

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/workspaces/${workspaceId}/pyodide/files`
      );
      expect(mockRuntime.writeFile).toHaveBeenCalledWith('/workspace/test.py', 'print("Hello")');
    });
  });

  describe('path handling', () => {
    it('should handle relative paths', async () => {
      await fileSystem.createFile('subfolder/test.py', 'print("Hello")');

      expect(mockRuntime.writeFile).toHaveBeenCalledWith('/workspace/subfolder/test.py', 'print("Hello")');
    });

    it('should handle absolute paths', async () => {
      await fileSystem.createFile('/workspace/test.py', 'print("Hello")');

      expect(mockRuntime.writeFile).toHaveBeenCalledWith('/workspace/test.py', 'print("Hello")');
    });
  });
});
