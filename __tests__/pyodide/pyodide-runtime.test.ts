/**
 * @jest-environment jsdom
 */

import { PyodideRuntime } from '@/components/pyodide/core/pyodide-runtime';

// Mock Pyodide
const mockPyodide = {
  runPython: jest.fn(),
  runPythonAsync: jest.fn(),
  loadPackage: jest.fn(),
  FS: {
    mkdirTree: jest.fn(),
    mount: jest.fn(),
    syncfs: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    filesystems: {
      IDBFS: {}
    }
  },
  globals: {
    toJs: jest.fn(() => ({})),
    set: jest.fn()
  }
};

// Mock loadPyodide
jest.mock('pyodide', () => ({
  loadPyodide: jest.fn(() => Promise.resolve(mockPyodide))
}));

describe('PyodideRuntime', () => {
  let runtime: PyodideRuntime;

  beforeEach(() => {
    jest.clearAllMocks();
    runtime = new PyodideRuntime({
      stdout: jest.fn(),
      stderr: jest.fn()
    });
  });

  afterEach(async () => {
    if (runtime.initialized) {
      await runtime.cleanup();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockPyodide.runPython.mockReturnValue(undefined);
      mockPyodide.loadPackage.mockResolvedValue(undefined);
      mockPyodide.FS.syncfs.mockImplementation((populate, callback) => callback(null));

      await runtime.initialize();

      expect(runtime.initialized).toBe(true);
      expect(runtime.loading).toBe(false);
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Failed to load Pyodide');
      require('pyodide').loadPyodide.mockRejectedValue(error);

      await expect(runtime.initialize()).rejects.toThrow('Failed to load Pyodide');
      expect(runtime.initialized).toBe(false);
    });

    it('should not initialize twice', async () => {
      mockPyodide.runPython.mockReturnValue(undefined);
      mockPyodide.loadPackage.mockResolvedValue(undefined);
      mockPyodide.FS.syncfs.mockImplementation((populate, callback) => callback(null));

      await runtime.initialize();
      const loadPyodideSpy = require('pyodide').loadPyodide;
      loadPyodideSpy.mockClear();

      await runtime.initialize();

      expect(loadPyodideSpy).not.toHaveBeenCalled();
    });
  });

  describe('Python execution', () => {
    beforeEach(async () => {
      mockPyodide.runPython.mockReturnValue(undefined);
      mockPyodide.loadPackage.mockResolvedValue(undefined);
      mockPyodide.FS.syncfs.mockImplementation((populate, callback) => callback(null));
      await runtime.initialize();
    });

    it('should execute Python code successfully', async () => {
      const result = 'Hello, World!';
      mockPyodide.runPythonAsync.mockResolvedValue(result);

      const executionResult = await runtime.runPython('print("Hello, World!")');

      expect(executionResult.success).toBe(true);
      expect(executionResult.result).toBe(result);
      expect(mockPyodide.runPythonAsync).toHaveBeenCalledWith('print("Hello, World!")');
    });

    it('should handle Python execution errors', async () => {
      const error = new Error('NameError: name "undefined_var" is not defined');
      mockPyodide.runPythonAsync.mockRejectedValue(error);

      const executionResult = await runtime.runPython('print(undefined_var)');

      expect(executionResult.success).toBe(false);
      expect(executionResult.error).toBe(error.message);
    });

    it('should capture stdout and stderr', async () => {
      const stdout = jest.fn();
      const stderr = jest.fn();
      
      runtime = new PyodideRuntime({ stdout, stderr });
      await runtime.initialize();

      // Simulate output capture
      runtime['config'].stdout?.('Hello from stdout');
      runtime['config'].stderr?.('Error from stderr');

      expect(stdout).toHaveBeenCalledWith('Hello from stdout');
      expect(stderr).toHaveBeenCalledWith('Error from stderr');
    });
  });

  describe('package management', () => {
    beforeEach(async () => {
      mockPyodide.runPython.mockReturnValue(undefined);
      mockPyodide.loadPackage.mockResolvedValue(undefined);
      mockPyodide.FS.syncfs.mockImplementation((populate, callback) => callback(null));
      await runtime.initialize();
    });

    it('should install packages successfully', async () => {
      mockPyodide.runPythonAsync.mockResolvedValue(undefined);

      const success = await runtime.installPackage('numpy');

      expect(success).toBe(true);
      expect(mockPyodide.runPythonAsync).toHaveBeenCalledWith(
        expect.stringContaining("await micropip.install('numpy')")
      );
    });

    it('should handle package installation errors', async () => {
      mockPyodide.runPythonAsync.mockRejectedValue(new Error('Package not found'));

      const success = await runtime.installPackage('nonexistent-package');

      expect(success).toBe(false);
    });

    it('should get installed packages', async () => {
      const packages = { numpy: '1.21.0', pandas: '1.3.0' };
      mockPyodide.runPythonAsync.mockResolvedValue(
        JSON.stringify([
          { name: 'numpy', version: '1.21.0', installed: true },
          { name: 'pandas', version: '1.3.0', installed: true }
        ])
      );

      const installedPackages = await runtime.getInstalledPackages();

      expect(installedPackages).toHaveLength(2);
      expect(installedPackages[0]).toEqual({
        name: 'numpy',
        version: '1.21.0',
        installed: true
      });
    });
  });

  describe('file system operations', () => {
    beforeEach(async () => {
      mockPyodide.runPython.mockReturnValue(undefined);
      mockPyodide.loadPackage.mockResolvedValue(undefined);
      mockPyodide.FS.syncfs.mockImplementation((populate, callback) => callback(null));
      await runtime.initialize();
    });

    it('should write files', async () => {
      mockPyodide.FS.mkdirTree.mockReturnValue(undefined);
      mockPyodide.FS.writeFile.mockReturnValue(undefined);

      await runtime.writeFile('/workspace/test.py', 'print("Hello")');

      expect(mockPyodide.FS.writeFile).toHaveBeenCalledWith(
        '/workspace/test.py',
        'print("Hello")',
        { encoding: 'utf8' }
      );
    });

    it('should read files', () => {
      const content = 'print("Hello")';
      mockPyodide.FS.readFile.mockReturnValue(content);

      const result = runtime.readFile('/workspace/test.py');

      expect(result).toBe(content);
      expect(mockPyodide.FS.readFile).toHaveBeenCalledWith(
        '/workspace/test.py',
        { encoding: 'utf8' }
      );
    });

    it('should list directories', () => {
      const files = ['test.py', 'data.csv', '.', '..'];
      mockPyodide.FS.readdir.mockReturnValue(files);

      const result = runtime.listDirectory('/workspace');

      expect(result).toEqual(['test.py', 'data.csv']);
      expect(mockPyodide.FS.readdir).toHaveBeenCalledWith('/workspace');
    });

    it('should check file existence', () => {
      mockPyodide.FS.stat.mockReturnValue({ size: 100 });

      const exists = runtime.exists('/workspace/test.py');

      expect(exists).toBe(true);
      expect(mockPyodide.FS.stat).toHaveBeenCalledWith('/workspace/test.py');
    });

    it('should handle file not found', () => {
      mockPyodide.FS.stat.mockImplementation(() => {
        throw new Error('File not found');
      });

      const exists = runtime.exists('/workspace/nonexistent.py');

      expect(exists).toBe(false);
    });
  });

  describe('globals management', () => {
    beforeEach(async () => {
      mockPyodide.runPython.mockReturnValue(undefined);
      mockPyodide.loadPackage.mockResolvedValue(undefined);
      mockPyodide.FS.syncfs.mockImplementation((populate, callback) => callback(null));
      await runtime.initialize();
    });

    it('should get Python globals', () => {
      const globals = { __name__: '__main__', test_var: 42 };
      mockPyodide.globals.toJs.mockReturnValue(globals);

      const result = runtime.getGlobals();

      expect(result).toEqual(globals);
    });

    it('should set Python global variables', () => {
      runtime.setGlobal('test_var', 'test_value');

      expect(mockPyodide.globals.set).toHaveBeenCalledWith('test_var', 'test_value');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', async () => {
      mockPyodide.runPython.mockReturnValue(undefined);
      mockPyodide.loadPackage.mockResolvedValue(undefined);
      mockPyodide.FS.syncfs.mockImplementation((populate, callback) => callback(null));
      
      await runtime.initialize();
      expect(runtime.initialized).toBe(true);

      await runtime.cleanup();

      expect(runtime.initialized).toBe(false);
      expect(runtime.loading).toBe(false);
    });
  });
});
