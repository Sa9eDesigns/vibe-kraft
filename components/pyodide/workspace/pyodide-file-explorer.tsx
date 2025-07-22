'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Folder,
  File,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit,
  Copy,
  Search,
  RefreshCw,
  FolderPlus,
  FileText,
  Code,
  Image,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePyodide } from '../hooks/use-pyodide';
import { FileInfo } from '../core/pyodide-filesystem';

interface PyodideFileExplorerProps {
  workspaceId: string;
  className?: string;
  onFileSelect?: (file: FileInfo) => void;
  onFileOpen?: (file: FileInfo) => void;
}

export function PyodideFileExplorer({
  workspaceId,
  className,
  onFileSelect,
  onFileOpen
}: PyodideFileExplorerProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const {
    isInitialized,
    listDirectory,
    createFile,
    fileSystem,
    uploadFile,
    downloadFile
  } = usePyodide({ workspaceId });

  // Load directory contents
  const loadDirectory = useCallback(async (path: string = '') => {
    if (!isInitialized || !fileSystem) return;

    setIsLoading(true);
    try {
      const dirFiles = await listDirectory(path);
      setFiles(dirFiles);
      setCurrentPath(path);
    } catch (error) {
      console.error('Failed to load directory:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, listDirectory, fileSystem]);

  // Initial load
  useEffect(() => {
    if (isInitialized) {
      loadDirectory();
    }
  }, [isInitialized, loadDirectory]);

  // Filter files based on search
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get file icon
  const getFileIcon = (file: FileInfo) => {
    if (file.type === 'directory') {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py':
        return <Code className="h-4 w-4 text-green-500" />;
      case 'txt':
      case 'md':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <Image className="h-4 w-4 text-purple-500" />;
      case 'zip':
      case 'tar':
      case 'gz':
        return <Archive className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  // Handle file selection
  const handleFileSelect = (file: FileInfo) => {
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  // Handle file double-click
  const handleFileDoubleClick = (file: FileInfo) => {
    if (file.type === 'directory') {
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      loadDirectory(newPath);
    } else {
      onFileOpen?.(file);
    }
  };

  // Navigate up
  const navigateUp = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.join('/');
    loadDirectory(newPath);
  };

  // Create new file
  const handleCreateFile = async () => {
    if (!newItemName.trim() || !fileSystem) return;

    try {
      const filePath = currentPath ? `${currentPath}/${newItemName}` : newItemName;
      await createFile(filePath, '# New Python file\n');
      await loadDirectory(currentPath);
      setShowNewFileDialog(false);
      setNewItemName('');
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newItemName.trim() || !fileSystem) return;

    try {
      const folderPath = currentPath ? `${currentPath}/${newItemName}` : newItemName;
      await fileSystem.createDirectory(folderPath);
      await loadDirectory(currentPath);
      setShowNewFolderDialog(false);
      setNewItemName('');
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  // Delete file/folder
  const handleDelete = async (file: FileInfo) => {
    if (!fileSystem) return;

    try {
      await fileSystem.delete(file.path);
      await loadDirectory(currentPath);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  // Upload file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const targetPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      await uploadFile(file, targetPath);
      await loadDirectory(currentPath);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  // Download file
  const handleDownload = async (file: FileInfo) => {
    if (file.type === 'directory') return;

    try {
      const blob = await downloadFile(file.path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Files</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadDirectory(currentPath)}
              disabled={isLoading}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
            </Button>
            
            <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New File</DialogTitle>
                  <DialogDescription>
                    Enter a name for the new Python file.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="filename">File Name</Label>
                  <Input
                    id="filename"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="example.py"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFile} disabled={!newItemName.trim()}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <FolderPlus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                  <DialogDescription>
                    Enter a name for the new folder.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="foldername">Folder Name</Label>
                  <Input
                    id="foldername"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="my-folder"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder} disabled={!newItemName.trim()}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="h-7 w-7 p-0"
            >
              <Upload className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>

        {/* Breadcrumb */}
        {currentPath && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadDirectory('')}
              className="h-6 px-2 text-xs"
            >
              workspace
            </Button>
            {currentPath.split('/').map((part, index, array) => (
              <React.Fragment key={index}>
                <span>/</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const path = array.slice(0, index + 1).join('/');
                    loadDirectory(path);
                  }}
                  className="h-6 px-2 text-xs"
                >
                  {part}
                </Button>
              </React.Fragment>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateUp}
              className="h-6 px-2 text-xs ml-2"
            >
              ↑
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        <div className="space-y-1 p-3">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">
                {searchQuery ? 'No files match your search' : 'No files in this directory'}
              </div>
            </div>
          ) : (
            filteredFiles.map((file) => (
              <ContextMenu key={file.path}>
                <ContextMenuTrigger>
                  <div
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors',
                      selectedFile?.path === file.path && 'bg-muted'
                    )}
                    onClick={() => handleFileSelect(file)}
                    onDoubleClick={() => handleFileDoubleClick(file)}
                  >
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {file.type === 'file' && formatFileSize(file.size)}
                        {file.type === 'directory' && 'Folder'}
                      </div>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  {file.type === 'file' && (
                    <>
                      <ContextMenuItem onClick={() => onFileOpen?.(file)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Open
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleDownload(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                    </>
                  )}
                  <ContextMenuItem onClick={() => handleDelete(file)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
