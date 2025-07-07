import { useState, useCallback, useEffect } from 'react';
import type { DevSandbox } from '../core/dev-sandbox';
import type { FileInfo } from '../types';

export interface UseFileSystemReturn {
  // Current state
  currentPath: string;
  files: FileInfo[];
  selectedFile: FileInfo | null;
  isLoading: boolean;
  error: Error | null;
  
  // Navigation
  navigateToPath: (path: string) => Promise<void>;
  navigateUp: () => Promise<void>;
  navigateToHome: () => Promise<void>;
  refreshCurrentPath: () => Promise<void>;
  
  // File operations
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  createFile: (path: string, content?: string) => Promise<void>;
  createDirectory: (path: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  deleteDirectory: (path: string) => Promise<void>;
  copyFile: (sourcePath: string, destPath: string) => Promise<void>;
  moveFile: (sourcePath: string, destPath: string) => Promise<void>;
  renameFile: (oldPath: string, newPath: string) => Promise<void>;
  
  // File selection
  selectFile: (file: FileInfo) => void;
  clearSelection: () => void;
  
  // Search and filtering
  searchFiles: (pattern: string) => Promise<FileInfo[]>;
  filterFiles: (predicate: (file: FileInfo) => boolean) => FileInfo[];
  
  // File content operations
  getFileContent: (path: string) => Promise<string>;
  saveFileContent: (path: string, content: string) => Promise<void>;
  
  // Utility functions
  getFileExtension: (filename: string) => string;
  getFileType: (filename: string) => string;
  isTextFile: (filename: string) => boolean;
  isBinaryFile: (filename: string) => boolean;
  formatFileSize: (bytes: number) => string;
  
  // Breadcrumb navigation
  breadcrumb: string[];
  navigateToBreadcrumb: (index: number) => Promise<void>;
}

export function useFileSystem(
  sandbox: DevSandbox,
  initialPath: string = '/home/user'
): UseFileSystemReturn {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);

  // Navigate to path
  const navigateToPath = useCallback(async (path: string) => {
    if (!sandbox?.isReady()) {
      setError(new Error('Sandbox is not ready'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fileList = await sandbox.listFiles(path);
      setFiles(fileList);
      setCurrentPath(path);
      
      // Update breadcrumb
      const parts = path.split('/').filter(Boolean);
      setBreadcrumb(['Home', ...parts]);
      
      // Clear selection if file is not in new directory
      if (selectedFile && !selectedFile.path.startsWith(path)) {
        setSelectedFile(null);
      }
      
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [sandbox, selectedFile]);

  // Navigate up one directory
  const navigateUp = useCallback(async () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    await navigateToPath(parentPath);
  }, [currentPath, navigateToPath]);

  // Navigate to home directory
  const navigateToHome = useCallback(async () => {
    await navigateToPath(initialPath);
  }, [initialPath, navigateToPath]);

  // Refresh current path
  const refreshCurrentPath = useCallback(async () => {
    await navigateToPath(currentPath);
  }, [currentPath, navigateToPath]);

  // Read file content
  const readFile = useCallback(async (path: string): Promise<string> => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    try {
      return await sandbox.readFile(path);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [sandbox]);

  // Write file content
  const writeFile = useCallback(async (path: string, content: string) => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    try {
      await sandbox.writeFile(path, content);
      await refreshCurrentPath();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [sandbox, refreshCurrentPath]);

  // Create new file
  const createFile = useCallback(async (path: string, content: string = '') => {
    await writeFile(path, content);
  }, [writeFile]);

  // Create new directory
  const createDirectory = useCallback(async (path: string) => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    try {
      await sandbox.executeCommand('mkdir', ['-p', path]);
      await refreshCurrentPath();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [sandbox, refreshCurrentPath]);

  // Delete file
  const deleteFile = useCallback(async (path: string) => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    try {
      await sandbox.executeCommand('rm', [path]);
      await refreshCurrentPath();
      
      // Clear selection if deleted file was selected
      if (selectedFile?.path === path) {
        setSelectedFile(null);
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [sandbox, refreshCurrentPath, selectedFile]);

  // Delete directory
  const deleteDirectory = useCallback(async (path: string) => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    try {
      await sandbox.executeCommand('rm', ['-rf', path]);
      await refreshCurrentPath();
      
      // Clear selection if deleted directory contained selected file
      if (selectedFile?.path.startsWith(path)) {
        setSelectedFile(null);
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [sandbox, refreshCurrentPath, selectedFile]);

  // Copy file
  const copyFile = useCallback(async (sourcePath: string, destPath: string) => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    try {
      await sandbox.executeCommand('cp', [sourcePath, destPath]);
      await refreshCurrentPath();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [sandbox, refreshCurrentPath]);

  // Move file
  const moveFile = useCallback(async (sourcePath: string, destPath: string) => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    try {
      await sandbox.executeCommand('mv', [sourcePath, destPath]);
      await refreshCurrentPath();
      
      // Update selection if moved file was selected
      if (selectedFile?.path === sourcePath) {
        setSelectedFile({
          ...selectedFile,
          path: destPath,
          name: destPath.split('/').pop() || selectedFile.name
        });
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [sandbox, refreshCurrentPath, selectedFile]);

  // Rename file
  const renameFile = useCallback(async (oldPath: string, newPath: string) => {
    await moveFile(oldPath, newPath);
  }, [moveFile]);

  // Select file
  const selectFile = useCallback((file: FileInfo) => {
    setSelectedFile(file);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedFile(null);
  }, []);

  // Search files
  const searchFiles = useCallback(async (pattern: string): Promise<FileInfo[]> => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    try {
      const result = await sandbox.executeCommand('find', [currentPath, '-name', pattern]);
      const paths = result.stdout.split('\n').filter(path => path.trim());
      
      // Get file info for each found file
      const foundFiles: FileInfo[] = [];
      for (const path of paths) {
        try {
          const fileList = await sandbox.listFiles(path.split('/').slice(0, -1).join('/') || '/');
          const fileName = path.split('/').pop();
          const fileInfo = fileList.find(f => f.name === fileName);
          if (fileInfo) {
            foundFiles.push({
              ...fileInfo,
              path
            });
          }
        } catch (err) {
          // Skip files that can't be accessed
          console.warn(`Could not access file: ${path}`);
        }
      }
      
      return foundFiles;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [sandbox, currentPath]);

  // Filter files
  const filterFiles = useCallback((predicate: (file: FileInfo) => boolean): FileInfo[] => {
    return files.filter(predicate);
  }, [files]);

  // Get file content (alias for readFile)
  const getFileContent = useCallback(async (path: string): Promise<string> => {
    return await readFile(path);
  }, [readFile]);

  // Save file content (alias for writeFile)
  const saveFileContent = useCallback(async (path: string, content: string) => {
    await writeFile(path, content);
  }, [writeFile]);

  // Get file extension
  const getFileExtension = useCallback((filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }, []);

  // Get file type
  const getFileType = useCallback((filename: string): string => {
    const extension = getFileExtension(filename);
    
    const typeMap: Record<string, string> = {
      // Text
      txt: 'text',
      md: 'markdown',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      
      // Code
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      rs: 'rust',
      go: 'go',
      php: 'php',
      rb: 'ruby',
      sh: 'shell',
      
      // Web
      html: 'html',
      css: 'css',
      scss: 'scss',
      
      // Images
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
      gif: 'image',
      svg: 'image',
      
      // Video
      mp4: 'video',
      avi: 'video',
      mov: 'video',
      
      // Audio
      mp3: 'audio',
      wav: 'audio',
      flac: 'audio',
      
      // Archives
      zip: 'archive',
      tar: 'archive',
      gz: 'archive',
      rar: 'archive',
    };
    
    return typeMap[extension] || 'unknown';
  }, [getFileExtension]);

  // Check if file is text file
  const isTextFile = useCallback((filename: string): boolean => {
    const type = getFileType(filename);
    return ['text', 'markdown', 'json', 'xml', 'yaml', 'javascript', 'typescript', 
            'python', 'java', 'cpp', 'c', 'rust', 'go', 'php', 'ruby', 'shell',
            'html', 'css', 'scss'].includes(type);
  }, [getFileType]);

  // Check if file is binary file
  const isBinaryFile = useCallback((filename: string): boolean => {
    return !isTextFile(filename);
  }, [isTextFile]);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }, []);

  // Navigate to breadcrumb
  const navigateToBreadcrumb = useCallback(async (index: number) => {
    if (index === 0) {
      await navigateToHome();
    } else {
      const pathParts = breadcrumb.slice(1, index + 1);
      const path = '/' + pathParts.join('/');
      await navigateToPath(path);
    }
  }, [breadcrumb, navigateToHome, navigateToPath]);

  // Initialize with current path
  useEffect(() => {
    if (sandbox?.isReady()) {
      navigateToPath(currentPath);
    }
  }, [sandbox, currentPath, navigateToPath]);

  return {
    // Current state
    currentPath,
    files,
    selectedFile,
    isLoading,
    error,
    
    // Navigation
    navigateToPath,
    navigateUp,
    navigateToHome,
    refreshCurrentPath,
    
    // File operations
    readFile,
    writeFile,
    createFile,
    createDirectory,
    deleteFile,
    deleteDirectory,
    copyFile,
    moveFile,
    renameFile,
    
    // File selection
    selectFile,
    clearSelection,
    
    // Search and filtering
    searchFiles,
    filterFiles,
    
    // File content operations
    getFileContent,
    saveFileContent,
    
    // Utility functions
    getFileExtension,
    getFileType,
    isTextFile,
    isBinaryFile,
    formatFileSize,
    
    // Breadcrumb navigation
    breadcrumb,
    navigateToBreadcrumb
  };
}