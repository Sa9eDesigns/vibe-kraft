'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Folder, 
  File, 
  Plus, 
  Trash2, 
  Edit, 
  RefreshCw,
  Home,
  ChevronRight,
  ChevronDown,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  Link} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DevSandbox } from '../core/dev-sandbox';
import type { FileInfo } from '../types';

interface FileExplorerProps {
  sandbox: DevSandbox;
  rootPath?: string;
  showHidden?: boolean;
  onFileSelect?: (file: FileInfo) => void;
  onFileCreate?: (path: string) => void;
  onFileDelete?: (path: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
  className?: string;
  height?: string | number;
}

interface TreeNode {
  file: FileInfo;
  children?: TreeNode[];
  expanded: boolean;
  loading: boolean;
}

export function FileExplorer({
  sandbox,
  rootPath = '/home/user',
  showHidden = false,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  className,
  height = '100%'
}: FileExplorerProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [currentPath, setCurrentPath] = useState(rootPath);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);

  // File type icons
  const getFileIcon = (file: FileInfo) => {
    if (file.type === 'directory') {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }
    
    if (file.type === 'symlink') {
      return <Link className="h-4 w-4 text-cyan-500" />;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    const iconMap: Record<string, React.ReactNode> = {
      // Text files
      txt: <FileText className="h-4 w-4 text-gray-500" />,
      md: <FileText className="h-4 w-4 text-gray-500" />,
      json: <FileCode className="h-4 w-4 text-yellow-500" />,
      
      // Code files
      js: <FileCode className="h-4 w-4 text-yellow-500" />,
      ts: <FileCode className="h-4 w-4 text-blue-500" />,
      py: <FileCode className="h-4 w-4 text-green-500" />,
      java: <FileCode className="h-4 w-4 text-red-500" />,
      cpp: <FileCode className="h-4 w-4 text-blue-500" />,
      c: <FileCode className="h-4 w-4 text-blue-500" />,
      rs: <FileCode className="h-4 w-4 text-orange-500" />,
      go: <FileCode className="h-4 w-4 text-blue-500" />,
      
      // Images
      png: <FileImage className="h-4 w-4 text-purple-500" />,
      jpg: <FileImage className="h-4 w-4 text-purple-500" />,
      jpeg: <FileImage className="h-4 w-4 text-purple-500" />,
      gif: <FileImage className="h-4 w-4 text-purple-500" />,
      svg: <FileImage className="h-4 w-4 text-purple-500" />,
      
      // Video
      mp4: <FileVideo className="h-4 w-4 text-red-500" />,
      avi: <FileVideo className="h-4 w-4 text-red-500" />,
      mov: <FileVideo className="h-4 w-4 text-red-500" />,
      
      // Audio
      mp3: <FileAudio className="h-4 w-4 text-green-500" />,
      wav: <FileAudio className="h-4 w-4 text-green-500" />,
      flac: <FileAudio className="h-4 w-4 text-green-500" />,
      
      // Archives
      zip: <FileArchive className="h-4 w-4 text-orange-500" />,
      tar: <FileArchive className="h-4 w-4 text-orange-500" />,
      gz: <FileArchive className="h-4 w-4 text-orange-500" />,
      rar: <FileArchive className="h-4 w-4 text-orange-500" />,
    };
    
    return iconMap[extension || ''] || <File className="h-4 w-4 text-gray-500" />;
  };

  // Load directory contents
  const loadDirectory = useCallback(async (path: string): Promise<FileInfo[]> => {
    if (!sandbox.isReady()) return [];
    
    try {
      const files = await sandbox.listFiles(path);
      
      // Filter hidden files if needed
      const filteredFiles = showHidden 
        ? files 
        : files.filter(file => !file.name.startsWith('.'));
      
      // Sort: directories first, then files, both alphabetically
      return filteredFiles.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Failed to load directory:', error);
      return [];
    }
  }, [sandbox, showHidden]);

  // Build tree structure
  const buildTree = useCallback(async (path: string): Promise<TreeNode[]> => {
    const files = await loadDirectory(path);
    
    return files.map(file => ({
      file: {
        ...file,
        path: path === '/' ? `/${file.name}` : `${path}/${file.name}`
      },
      children: undefined,
      expanded: false,
      loading: false
    }));
  }, [loadDirectory]);

  // Expand/collapse tree node
  const toggleNode = useCallback(async (targetPath: string) => {
    setTree(prevTree => {
      const updateNode = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
          if (node.file.path === targetPath) {
            if (node.file.type === 'directory') {
              if (!node.expanded) {
                // Expand - load children
                return {
                  ...node,
                  expanded: true,
                  loading: true
                };
              } else {
                // Collapse
                return {
                  ...node,
                  expanded: false,
                  children: undefined
                };
              }
            }
          }
          
          if (node.children) {
            return {
              ...node,
              children: updateNode(node.children)
            };
          }
          
          return node;
        });
      };
      
      return updateNode(prevTree);
    });
    
    // Load children if expanding
    const node = findNodeByPath(tree, targetPath);
    if (node && node.file.type === 'directory' && !node.expanded) {
      try {
        const children = await buildTree(targetPath);
        setTree(prevTree => {
          const updateNode = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map(node => {
              if (node.file.path === targetPath) {
                return {
                  ...node,
                  children,
                  loading: false
                };
              }
              
              if (node.children) {
                return {
                  ...node,
                  children: updateNode(node.children)
                };
              }
              
              return node;
            });
          };
          
          return updateNode(prevTree);
        });
      } catch (error) {
        console.error('Failed to load children:', error);
      }
    }
  }, [tree, buildTree]);

  // Find node by path
  const findNodeByPath = (nodes: TreeNode[], path: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.file.path === path) {
        return node;
      }
      if (node.children) {
        const found = findNodeByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: FileInfo) => {
    setSelectedFile(file);
    onFileSelect?.(file);
  }, [onFileSelect]);

  // Navigate to path
  const navigateToPath = useCallback(async (path: string) => {
    setIsLoading(true);
    try {
      const newTree = await buildTree(path);
      setTree(newTree);
      setCurrentPath(path);
      
      // Update breadcrumb
      const parts = path.split('/').filter(Boolean);
      setBreadcrumb(['Home', ...parts]);
    } catch (error) {
      console.error('Failed to navigate:', error);
    } finally {
      setIsLoading(false);
    }
  }, [buildTree]);

  // Create new file/folder
  const handleCreate = useCallback(async () => {
    if (!newFileName.trim() || !sandbox.isReady()) return;
    
    try {
      const newPath = `${currentPath}/${newFileName}`;
      
      if (createType === 'file') {
        await sandbox.writeFile(newPath, '');
      } else {
        await sandbox.executeCommand('mkdir', [newPath]);
      }
      
      onFileCreate?.(newPath);
      
      // Refresh current directory
      await navigateToPath(currentPath);
      
      setIsCreateDialogOpen(false);
      setNewFileName('');
    } catch (error) {
      console.error('Failed to create:', error);
    }
  }, [newFileName, currentPath, createType, sandbox, onFileCreate, navigateToPath]);

  // Delete file/folder
  const handleDelete = useCallback(async (file: FileInfo) => {
    if (!sandbox.isReady()) return;
    
    try {
      const command = file.type === 'directory' ? 'rmdir' : 'rm';
      await sandbox.executeCommand(command, [file.path]);
      
      onFileDelete?.(file.path);
      
      // Refresh current directory
      await navigateToPath(currentPath);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }, [sandbox, onFileDelete, navigateToPath, currentPath]);

  // Rename file/folder
  const handleRename = useCallback(async () => {
    if (!newFileName.trim() || !selectedFile || !sandbox.isReady()) return;
    
    try {
      const newPath = `${currentPath}/${newFileName}`;
      await sandbox.executeCommand('mv', [selectedFile.path, newPath]);
      
      onFileRename?.(selectedFile.path, newPath);
      
      // Refresh current directory
      await navigateToPath(currentPath);
      
      setIsRenameDialogOpen(false);
      setNewFileName('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to rename:', error);
    }
  }, [newFileName, selectedFile, currentPath, sandbox, onFileRename, navigateToPath]);

  // Refresh current directory
  const refresh = useCallback(() => {
    navigateToPath(currentPath);
  }, [navigateToPath, currentPath]);

  // Initialize
  useEffect(() => {
    if (sandbox.isReady()) {
      navigateToPath(rootPath);
    } else {
      sandbox.onReady(() => {
        navigateToPath(rootPath);
      });
    }
  }, [sandbox, rootPath, navigateToPath]);

  // Render tree node
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const { file, children, expanded, loading } = node;
    const isDirectory = file.type === 'directory';
    const isSelected = selectedFile?.path === file.path;
    
    return (
      <div key={file.path}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={cn(
                'flex items-center gap-2 px-2 py-1 rounded-sm cursor-pointer hover:bg-muted transition-colors',
                isSelected && 'bg-primary/10 text-primary',
                'group'
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => {
                handleFileSelect(file);
                if (isDirectory) {
                  toggleNode(file.path);
                }
              }}
            >
              {isDirectory && (
                <div className="flex items-center justify-center w-4 h-4">
                  {loading ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : expanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </div>
              )}
              
              {getFileIcon(file)}
              
              <span className="text-sm truncate flex-1">
                {file.name}
              </span>
              
              {file.type === 'directory' && (
                <Badge variant="secondary" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  DIR
                </Badge>
              )}
            </div>
          </ContextMenuTrigger>
          
          <ContextMenuContent>
            <ContextMenuItem onClick={() => handleFileSelect(file)}>
              <Edit className="h-4 w-4 mr-2" />
              Open
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => {
                setSelectedFile(file);
                setNewFileName(file.name);
                setIsRenameDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => handleDelete(file)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        
        {expanded && children && (
          <div>
            {children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-4 w-4" />
          File Explorer
        </CardTitle>
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateToPath('/home/user')}
            className="h-auto p-1"
          >
            <Home className="h-3 w-3" />
          </Button>
          {breadcrumb.map((part, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-3 w-3" />
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-xs"
                onClick={() => {
                  if (index === 0) {
                    navigateToPath('/home/user');
                  } else {
                    const path = '/' + breadcrumb.slice(1, index + 1).join('/');
                    navigateToPath(path);
                  }
                }}
              >
                {part}
              </Button>
            </React.Fragment>
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={createType === 'file' ? 'default' : 'outline'}
                    onClick={() => setCreateType('file')}
                  >
                    File
                  </Button>
                  <Button
                    variant={createType === 'folder' ? 'default' : 'outline'}
                    onClick={() => setCreateType('folder')}
                  >
                    Folder
                  </Button>
                </div>
                
                <Input
                  placeholder={`${createType === 'file' ? 'File' : 'Folder'} name`}
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreate();
                    }
                  }}
                />
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={!newFileName.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <div className="space-y-1">
                {tree.map(node => renderTreeNode(node))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {selectedFile?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="New name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
              }}
            />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRename} disabled={!newFileName.trim()}>
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}