'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Folder, 
  File, 
  FolderOpen, 
  Plus, 
  Search, 
  MoreHorizontal,
  Upload,
  Download,
  Trash2,
  Edit,
  Copy,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  FileText,
  Image,
  Code,
  Archive,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FirecrackerWorkspace } from '@/lib/types/firecracker';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  modified?: Date;
  children?: FileNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

interface FirecrackerFileExplorerProps {
  workspace: FirecrackerWorkspace;
  className?: string;
  onFileSelect?: (file: FileNode) => void;
  onFileOpen?: (file: FileNode) => void;
}

export function FirecrackerFileExplorer({ 
  workspace, 
  className,
  onFileSelect,
  onFileOpen
}: FirecrackerFileExplorerProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('/workspace');

  // Load initial file tree
  useEffect(() => {
    loadFileTree();
  }, [workspace.id]);

  const loadFileTree = async (path: string = '/workspace') => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from the Firecracker VM
      const response = await fetch(`/api/firecracker/workspaces/${workspace.id}/files?path=${encodeURIComponent(path)}`);
      
      if (response.ok) {
        const files = await response.json();
        setFileTree(files);
      } else {
        // Mock data for demonstration
        const mockFiles: FileNode[] = [
          {
            id: '1',
            name: 'src',
            type: 'directory',
            path: '/workspace/src',
            children: [
              {
                id: '2',
                name: 'main.py',
                type: 'file',
                path: '/workspace/src/main.py',
                size: 1024,
                modified: new Date(),
              },
              {
                id: '3',
                name: 'utils.py',
                type: 'file',
                path: '/workspace/src/utils.py',
                size: 512,
                modified: new Date(),
              },
            ],
            isExpanded: true,
          },
          {
            id: '4',
            name: 'README.md',
            type: 'file',
            path: '/workspace/README.md',
            size: 256,
            modified: new Date(),
          },
          {
            id: '5',
            name: 'package.json',
            type: 'file',
            path: '/workspace/package.json',
            size: 512,
            modified: new Date(),
          },
          {
            id: '6',
            name: 'node_modules',
            type: 'directory',
            path: '/workspace/node_modules',
            children: [],
            isExpanded: false,
          },
        ];
        setFileTree(mockFiles);
      }
    } catch (error) {
      console.error('Error loading file tree:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDirectory = async (node: FileNode) => {
    if (node.type !== 'directory') return;

    if (!node.isExpanded && (!node.children || node.children.length === 0)) {
      // Load directory contents
      setFileTree(prev => updateNodeInTree(prev, node.id, { isLoading: true }));
      
      try {
        // In a real implementation, fetch directory contents
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
        
        const mockChildren: FileNode[] = [
          {
            id: `${node.id}-child-1`,
            name: 'example.txt',
            type: 'file',
            path: `${node.path}/example.txt`,
            size: 128,
            modified: new Date(),
          },
        ];
        
        setFileTree(prev => updateNodeInTree(prev, node.id, { 
          children: mockChildren, 
          isExpanded: true, 
          isLoading: false 
        }));
      } catch (error) {
        console.error('Error loading directory:', error);
        setFileTree(prev => updateNodeInTree(prev, node.id, { isLoading: false }));
      }
    } else {
      setFileTree(prev => updateNodeInTree(prev, node.id, { 
        isExpanded: !node.isExpanded 
      }));
    }
  };

  const updateNodeInTree = (nodes: FileNode[], nodeId: string, updates: Partial<FileNode>): FileNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return { ...node, children: updateNodeInTree(node.children, nodeId, updates) };
      }
      return node;
    });
  };

  const handleFileClick = (file: FileNode) => {
    setSelectedFile(file);
    onFileSelect?.(file);
    
    if (file.type === 'file') {
      onFileOpen?.(file);
    }
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'directory') {
      return file.isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'go':
      case 'rs':
        return <Code className="h-4 w-4" />;
      case 'md':
      case 'txt':
      case 'json':
      case 'yaml':
      case 'yml':
        return <FileText className="h-4 w-4" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="h-4 w-4" />;
      case 'zip':
      case 'tar':
      case 'gz':
        return <Archive className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isSelected = selectedFile?.id === node.id;
    
    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-muted/50 rounded",
            isSelected && "bg-primary/10 text-primary",
            "group"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleDirectory(node);
            }
            handleFileClick(node);
          }}
        >
          {node.type === 'directory' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleDirectory(node);
              }}
            >
              {node.isLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : node.isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getFileIcon(node)}
            <span className="truncate">{node.name}</span>
            {node.type === 'file' && node.size && (
              <span className="text-xs text-muted-foreground ml-auto">
                {formatFileSize(node.size)}
              </span>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {node.type === 'file' && (
                <>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Copy Path
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {node.type === 'directory' && node.isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredFiles = searchQuery 
    ? fileTree.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : fileTree;

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Explorer
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => loadFileTree()}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <File className="h-4 w-4 mr-2" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Folder className="h-4 w-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <div className="p-2">
            {filteredFiles.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                {searchQuery ? 'No files found' : 'No files in workspace'}
              </div>
            ) : (
              filteredFiles.map(file => renderFileNode(file))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
