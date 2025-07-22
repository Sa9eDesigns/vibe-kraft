/**
 * Pyodide Runtime Service
 * Core service for managing Pyodide Python runtime in the browser
 */

import { loadPyodide, PyodideInterface } from 'pyodide';

export interface PyodideConfig {
  indexURL?: string;
  fullStdLib?: boolean;
  stdin?: (prompt: string) => string;
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
  jsglobals?: object;
}

export interface PythonExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  output?: string;
  stderr?: string;
}

export interface PackageInfo {
  name: string;
  version: string;
  installed: boolean;
  description?: string;
}

export class PyodideRuntime {
  private pyodide: PyodideInterface | null = null;
  private isInitialized = false;
  private isLoading = false;
  private outputBuffer: string[] = [];
  private errorBuffer: string[] = [];
  private config: PyodideConfig;
  private mountedPaths: Set<string> = new Set();

  constructor(config: PyodideConfig = {}) {
    this.config = {
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/',
      fullStdLib: false,
      ...config
    };
  }

  /**
   * Initialize Pyodide runtime
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || this.isLoading) {
      return;
    }

    this.isLoading = true;

    try {
      // Load Pyodide
      this.pyodide = await loadPyodide({
        indexURL: this.config.indexURL,
        fullStdLib: this.config.fullStdLib,
        stdin: this.config.stdin ? (() => this.config.stdin!('')) : undefined,
        stdout: (text: string) => {
          this.outputBuffer.push(text);
          this.config.stdout?.(text);
        },
        stderr: (text: string) => {
          this.errorBuffer.push(text);
          this.config.stderr?.(text);
        },
        jsglobals: this.config.jsglobals
      });

      // Set up file system
      await this.setupFileSystem();

      // Install basic packages
      await this.installBasicPackages();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Pyodide:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Set up file system with IDBFS for persistence
   */
  private async setupFileSystem(): Promise<void> {
    if (!this.pyodide) return;

    try {
      // Create persistent directory
      const persistentDir = '/workspace';
      this.pyodide.FS.mkdirTree(persistentDir);
      
      // Mount IDBFS for persistence
      this.pyodide.FS.mount(this.pyodide.FS.filesystems.IDBFS, {}, persistentDir);
      this.mountedPaths.add(persistentDir);

      // Sync from IndexedDB
      await new Promise<void>((resolve, reject) => {
        this.pyodide!.FS.syncfs(true, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Set working directory
      this.pyodide.runPython(`
import os
os.chdir('/workspace')
      `);
    } catch (error) {
      console.warn('Failed to setup persistent file system:', error);
      // Fall back to memory-only file system
      this.pyodide.FS.mkdirTree('/workspace');
      this.pyodide.runPython('import os; os.chdir("/workspace")');
    }
  }

  /**
   * Install basic Python packages
   */
  private async installBasicPackages(): Promise<void> {
    if (!this.pyodide) return;

    try {
      // Install micropip for package management
      await this.pyodide.loadPackage(['micropip']);
      
      // Install commonly used packages
      await this.runPython(`
import micropip
await micropip.install(['requests', 'numpy', 'matplotlib'])
      `);
    } catch (error) {
      console.warn('Failed to install basic packages:', error);
    }
  }

  /**
   * Execute Python code
   */
  async runPython(code: string): Promise<PythonExecutionResult> {
    if (!this.isInitialized || !this.pyodide) {
      throw new Error('Pyodide not initialized');
    }

    // Clear buffers
    this.outputBuffer = [];
    this.errorBuffer = [];

    try {
      const result = await this.pyodide.runPythonAsync(code);
      
      return {
        success: true,
        result,
        output: this.outputBuffer.join(''),
        stderr: this.errorBuffer.join('')
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        output: this.outputBuffer.join(''),
        stderr: this.errorBuffer.join('')
      };
    }
  }

  /**
   * Install Python package using micropip
   */
  async installPackage(packageName: string): Promise<boolean> {
    if (!this.isInitialized || !this.pyodide) {
      throw new Error('Pyodide not initialized');
    }

    try {
      await this.runPython(`
import micropip
await micropip.install('${packageName}')
      `);
      return true;
    } catch (error) {
      console.error(`Failed to install package ${packageName}:`, error);
      return false;
    }
  }

  /**
   * Get list of installed packages
   */
  async getInstalledPackages(): Promise<PackageInfo[]> {
    if (!this.isInitialized || !this.pyodide) {
      return [];
    }

    try {
      const result = await this.runPython(`
import micropip
import json
packages = micropip.list()
json.dumps([{'name': name, 'version': version, 'installed': True} for name, version in packages.items()])
      `);

      if (result.success && result.result) {
        return JSON.parse(result.result);
      }
    } catch (error) {
      console.error('Failed to get installed packages:', error);
    }

    return [];
  }

  /**
   * Write file to file system
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (!this.pyodide) {
      throw new Error('Pyodide not initialized');
    }

    try {
      // Ensure directory exists
      const dir = path.substring(0, path.lastIndexOf('/'));
      if (dir) {
        this.pyodide.FS.mkdirTree(dir);
      }

      // Write file
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      this.pyodide.FS.writeFile(path, data);
      
      // Sync to IndexedDB if using persistent storage
      if (this.mountedPaths.size > 0) {
        await this.syncFileSystem();
      }
    } catch (error) {
      console.error(`Failed to write file ${path}:`, error);
      throw error;
    }
  }

  /**
   * Read file from file system
   */
  readFile(path: string): string {
    if (!this.pyodide) {
      throw new Error('Pyodide not initialized');
    }

    try {
      return (this.pyodide.FS as any).readFile(path, { encoding: 'utf8' });
    } catch (error) {
      console.error(`Failed to read file ${path}:`, error);
      throw error;
    }
  }

  /**
   * List directory contents
   */
  listDirectory(path: string = '/workspace'): string[] {
    if (!this.pyodide) {
      throw new Error('Pyodide not initialized');
    }

    try {
      return this.pyodide.FS.readdir(path).filter(name => name !== '.' && name !== '..');
    } catch (error) {
      console.error(`Failed to list directory ${path}:`, error);
      return [];
    }
  }

  /**
   * Check if file/directory exists
   */
  exists(path: string): boolean {
    if (!this.pyodide) {
      return false;
    }

    try {
      this.pyodide.FS.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sync file system to IndexedDB
   */
  async syncFileSystem(): Promise<void> {
    if (!this.pyodide || this.mountedPaths.size === 0) {
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        this.pyodide!.FS.syncfs(false, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (error) {
      console.error('Failed to sync file system:', error);
    }
  }

  /**
   * Get Python globals
   */
  getGlobals(): any {
    if (!this.pyodide) {
      return {};
    }
    return this.pyodide.globals.toJs();
  }

  /**
   * Set Python global variable
   */
  setGlobal(name: string, value: any): void {
    if (!this.pyodide) {
      throw new Error('Pyodide not initialized');
    }
    this.pyodide.globals.set(name, value);
  }

  /**
   * Get initialization status
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get loading status
   */
  get loading(): boolean {
    return this.isLoading;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.pyodide) {
      await this.syncFileSystem();
      // Note: Pyodide doesn't have a cleanup method, but we can clear references
      this.pyodide = null;
    }
    this.isInitialized = false;
    this.isLoading = false;
    this.outputBuffer = [];
    this.errorBuffer = [];
    this.mountedPaths.clear();
  }
}

// Singleton instance
let pyodideInstance: PyodideRuntime | null = null;

/**
 * Get or create Pyodide runtime instance
 */
export function getPyodideRuntime(config?: PyodideConfig): PyodideRuntime {
  if (!pyodideInstance) {
    pyodideInstance = new PyodideRuntime(config);
  }
  return pyodideInstance;
}

/**
 * Initialize Pyodide runtime
 */
export async function initializePyodide(config?: PyodideConfig): Promise<PyodideRuntime> {
  const runtime = getPyodideRuntime(config);
  await runtime.initialize();
  return runtime;
}
