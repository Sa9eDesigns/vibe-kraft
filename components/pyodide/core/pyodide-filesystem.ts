/**
 * Pyodide File System Integration
 * Handles file operations and persistence for Pyodide workspaces
 */

import { PyodideRuntime } from './pyodide-runtime';

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  content?: string;
}

export interface FileSystemStats {
  totalFiles: number;
  totalSize: number;
  directories: number;
  lastModified: Date;
}

export class PyodideFileSystem {
  private runtime: PyodideRuntime;
  private workspaceId: string;
  private basePath: string;

  constructor(runtime: PyodideRuntime, workspaceId: string) {
    this.runtime = runtime;
    this.workspaceId = workspaceId;
    this.basePath = '/workspace';
  }

  /**
   * Create a new file
   */
  async createFile(path: string, content: string = ''): Promise<void> {
    const fullPath = this.getFullPath(path);
    await this.runtime.writeFile(fullPath, content);

    // Sync to database
    await this.syncToDatabase(path, content, false);
  }

  /**
   * Create a new directory
   */
  async createDirectory(path: string): Promise<void> {
    if (!this.runtime.initialized) {
      throw new Error('Pyodide runtime not initialized');
    }

    const fullPath = this.getFullPath(path);
    
    try {
      // Use Python to create directory
      await this.runtime.runPython(`
import os
os.makedirs('${fullPath}', exist_ok=True)
      `);
      
      await this.runtime.syncFileSystem();

      // Sync to database
      await this.syncToDatabase(path, '', true);
    } catch (error) {
      console.error(`Failed to create directory ${path}:`, error);
      throw error;
    }
  }

  /**
   * Read file content
   */
  async readFile(path: string): Promise<string> {
    const fullPath = this.getFullPath(path);
    return this.runtime.readFile(fullPath);
  }

  /**
   * Write file content
   */
  async writeFile(path: string, content: string): Promise<void> {
    const fullPath = this.getFullPath(path);
    await this.runtime.writeFile(fullPath, content);

    // Update in database
    await this.updateInDatabase(path, content);
  }

  /**
   * Delete file or directory
   */
  async delete(path: string): Promise<void> {
    if (!this.runtime.initialized) {
      throw new Error('Pyodide runtime not initialized');
    }

    const fullPath = this.getFullPath(path);
    
    try {
      await this.runtime.runPython(`
import os
import shutil

path = '${fullPath}'
if os.path.isfile(path):
    os.remove(path)
elif os.path.isdir(path):
    shutil.rmtree(path)
      `);
      
      await this.runtime.syncFileSystem();

      // Delete from database
      await this.deleteFromDatabase(path);
    } catch (error) {
      console.error(`Failed to delete ${path}:`, error);
      throw error;
    }
  }

  /**
   * Move/rename file or directory
   */
  async move(fromPath: string, toPath: string): Promise<void> {
    if (!this.runtime.initialized) {
      throw new Error('Pyodide runtime not initialized');
    }

    const fullFromPath = this.getFullPath(fromPath);
    const fullToPath = this.getFullPath(toPath);
    
    try {
      await this.runtime.runPython(`
import os
import shutil

from_path = '${fullFromPath}'
to_path = '${fullToPath}'

# Ensure target directory exists
os.makedirs(os.path.dirname(to_path), exist_ok=True)

# Move file/directory
shutil.move(from_path, to_path)
      `);
      
      await this.runtime.syncFileSystem();
    } catch (error) {
      console.error(`Failed to move ${fromPath} to ${toPath}:`, error);
      throw error;
    }
  }

  /**
   * Copy file or directory
   */
  async copy(fromPath: string, toPath: string): Promise<void> {
    if (!this.runtime.initialized) {
      throw new Error('Pyodide runtime not initialized');
    }

    const fullFromPath = this.getFullPath(fromPath);
    const fullToPath = this.getFullPath(toPath);
    
    try {
      await this.runtime.runPython(`
import os
import shutil

from_path = '${fullFromPath}'
to_path = '${fullToPath}'

# Ensure target directory exists
os.makedirs(os.path.dirname(to_path), exist_ok=True)

# Copy file/directory
if os.path.isfile(from_path):
    shutil.copy2(from_path, to_path)
elif os.path.isdir(from_path):
    shutil.copytree(from_path, to_path)
      `);
      
      await this.runtime.syncFileSystem();
    } catch (error) {
      console.error(`Failed to copy ${fromPath} to ${toPath}:`, error);
      throw error;
    }
  }

  /**
   * List directory contents with detailed info
   */
  async listDirectory(path: string = ''): Promise<FileInfo[]> {
    if (!this.runtime.initialized) {
      throw new Error('Pyodide runtime not initialized');
    }

    const fullPath = this.getFullPath(path);
    
    try {
      const result = await this.runtime.runPython(`
import os
import json
from datetime import datetime

path = '${fullPath}'
files = []

if os.path.exists(path):
    for item in os.listdir(path):
        item_path = os.path.join(path, item)
        stat = os.stat(item_path)
        
        files.append({
            'name': item,
            'path': item_path.replace('/workspace/', ''),
            'type': 'directory' if os.path.isdir(item_path) else 'file',
            'size': stat.st_size,
            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
        })

json.dumps(files)
      `);

      if (result.success && result.result) {
        const files = JSON.parse(result.result);
        return files.map((file: any) => ({
          ...file,
          modified: new Date(file.modified)
        }));
      }
    } catch (error) {
      console.error(`Failed to list directory ${path}:`, error);
    }

    return [];
  }

  /**
   * Get file/directory info
   */
  async getInfo(path: string): Promise<FileInfo | null> {
    if (!this.runtime.initialized) {
      throw new Error('Pyodide runtime not initialized');
    }

    const fullPath = this.getFullPath(path);
    
    try {
      const result = await this.runtime.runPython(`
import os
import json
from datetime import datetime

path = '${fullPath}'

if os.path.exists(path):
    stat = os.stat(path)
    info = {
        'name': os.path.basename(path),
        'path': path.replace('/workspace/', ''),
        'type': 'directory' if os.path.isdir(path) else 'file',
        'size': stat.st_size,
        'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
    }
    json.dumps(info)
else:
    None
      `);

      if (result.success && result.result && result.result !== 'None') {
        const info = JSON.parse(result.result);
        return {
          ...info,
          modified: new Date(info.modified)
        };
      }
    } catch (error) {
      console.error(`Failed to get info for ${path}:`, error);
    }

    return null;
  }

  /**
   * Check if path exists
   */
  async exists(path: string): Promise<boolean> {
    const fullPath = this.getFullPath(path);
    return this.runtime.exists(fullPath);
  }

  /**
   * Get file system statistics
   */
  async getStats(): Promise<FileSystemStats> {
    if (!this.runtime.initialized) {
      throw new Error('Pyodide runtime not initialized');
    }

    try {
      const result = await this.runtime.runPython(`
import os
import json
from datetime import datetime

def get_dir_stats(path):
    total_files = 0
    total_size = 0
    directories = 0
    last_modified = 0
    
    for root, dirs, files in os.walk(path):
        directories += len(dirs)
        for file in files:
            file_path = os.path.join(root, file)
            try:
                stat = os.stat(file_path)
                total_files += 1
                total_size += stat.st_size
                last_modified = max(last_modified, stat.st_mtime)
            except:
                pass
    
    return {
        'totalFiles': total_files,
        'totalSize': total_size,
        'directories': directories,
        'lastModified': datetime.fromtimestamp(last_modified).isoformat() if last_modified > 0 else datetime.now().isoformat()
    }

stats = get_dir_stats('/workspace')
json.dumps(stats)
      `);

      if (result.success && result.result) {
        const stats = JSON.parse(result.result);
        return {
          ...stats,
          lastModified: new Date(stats.lastModified)
        };
      }
    } catch (error) {
      console.error('Failed to get file system stats:', error);
    }

    return {
      totalFiles: 0,
      totalSize: 0,
      directories: 0,
      lastModified: new Date()
    };
  }

  /**
   * Upload file from browser
   */
  async uploadFile(file: File, targetPath?: string): Promise<string> {
    const path = targetPath || file.name;
    const content = await file.text();
    await this.writeFile(path, content);
    return path;
  }

  /**
   * Download file as blob
   */
  async downloadFile(path: string): Promise<Blob> {
    const content = await this.readFile(path);
    return new Blob([content], { type: 'text/plain' });
  }

  /**
   * Search for files by name or content
   */
  async search(query: string, searchContent: boolean = false): Promise<FileInfo[]> {
    if (!this.runtime.initialized) {
      throw new Error('Pyodide runtime not initialized');
    }

    try {
      const result = await this.runtime.runPython(`
import os
import json
import re
from datetime import datetime

def search_files(query, search_content=False):
    results = []
    pattern = re.compile(query, re.IGNORECASE)
    
    for root, dirs, files in os.walk('/workspace'):
        for file in files:
            file_path = os.path.join(root, file)
            match = False
            
            # Search by filename
            if pattern.search(file):
                match = True
            
            # Search by content if requested
            if search_content and not match:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if pattern.search(content):
                            match = True
                except:
                    pass
            
            if match:
                try:
                    stat = os.stat(file_path)
                    results.append({
                        'name': file,
                        'path': file_path.replace('/workspace/', ''),
                        'type': 'file',
                        'size': stat.st_size,
                        'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                    })
                except:
                    pass
    
    return results

results = search_files('${query}', ${searchContent})
json.dumps(results)
      `);

      if (result.success && result.result) {
        const files = JSON.parse(result.result);
        return files.map((file: any) => ({
          ...file,
          modified: new Date(file.modified)
        }));
      }
    } catch (error) {
      console.error(`Failed to search for "${query}":`, error);
    }

    return [];
  }

  /**
   * Get full path from relative path
   */
  private getFullPath(path: string): string {
    if (path.startsWith('/')) {
      return path.startsWith('/workspace') ? path : `/workspace${path}`;
    }
    return `${this.basePath}/${path}`;
  }

  /**
   * Sync file system to persistent storage
   */
  async sync(): Promise<void> {
    await this.runtime.syncFileSystem();
  }

  /**
   * Sync file to database
   */
  private async syncToDatabase(path: string, content: string, isDirectory: boolean): Promise<void> {
    try {
      const response = await fetch(`/api/workspaces/${this.workspaceId}/pyodide/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path,
          content,
          isDirectory
        })
      });

      if (!response.ok) {
        console.warn(`Failed to sync file to database: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to sync file to database:', error);
    }
  }

  /**
   * Update file in database
   */
  private async updateInDatabase(path: string, content: string): Promise<void> {
    try {
      const response = await fetch(`/api/workspaces/${this.workspaceId}/pyodide/files/${encodeURIComponent(path)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content
        })
      });

      if (!response.ok) {
        console.warn(`Failed to update file in database: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to update file in database:', error);
    }
  }

  /**
   * Delete file from database
   */
  private async deleteFromDatabase(path: string): Promise<void> {
    try {
      const response = await fetch(`/api/workspaces/${this.workspaceId}/pyodide/files/${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        console.warn(`Failed to delete file from database: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to delete file from database:', error);
    }
  }

  /**
   * Load files from database
   */
  async loadFromDatabase(): Promise<void> {
    try {
      const response = await fetch(`/api/workspaces/${this.workspaceId}/pyodide/files`);

      if (!response.ok) {
        console.warn(`Failed to load files from database: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      const files = data.files || [];

      // Recreate files in Pyodide file system
      for (const file of files) {
        if (file.type === 'directory') {
          await this.runtime.runPython(`
import os
os.makedirs('${this.getFullPath(file.path)}', exist_ok=True)
          `);
        } else if (file.content) {
          await this.runtime.writeFile(this.getFullPath(file.path), file.content);
        }
      }

      await this.runtime.syncFileSystem();
    } catch (error) {
      console.warn('Failed to load files from database:', error);
    }
  }
}
