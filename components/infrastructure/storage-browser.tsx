"use client";

/**
 * Storage Browser Component
 * Production-ready MinIO storage browser with file management capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Folder,
  File,
  Upload,
  Download,
  Trash2,
  Search,
  RefreshCw,
  Grid,
  List,
  MoreHorizontal,
  FolderPlus,
  Eye,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

import { StorageBucket, StorageObject, StorageUsage } from '@/lib/infrastructure/types';
import { useStorageOperations } from '@/hooks/use-storage-operations';
import { formatBytes, formatDate } from '@/lib/utils';

interface StorageBrowserProps {
  buckets: StorageBucket[];
  usage: StorageUsage;
  onRefresh?: () => void;
}

export function StorageBrowser({ buckets, usage, onRefresh }: StorageBrowserProps) {
  const [selectedBucket, setSelectedBucket] = useState<StorageBucket | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set());

  const {
    objects,
    loading,
    uploadProgress,
    listObjects,
    uploadObject,
    downloadObject,
    deleteObject,
    createFolder,
  } = useStorageOperations();

  // Load objects when bucket or path changes
  useEffect(() => {
    if (selectedBucket) {
      listObjects(selectedBucket.name, currentPath);
    }
  }, [selectedBucket, currentPath, listObjects]);

  const handleBucketSelect = useCallback((bucket: StorageBucket) => {
    setSelectedBucket(bucket);
    setCurrentPath('');
    setSelectedObjects(new Set());
  }, []);

  const handleFolderClick = useCallback((folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
  }, [currentPath]);

  const handleBackClick = useCallback(() => {
    const pathParts = currentPath.split('/');
    pathParts.pop();
    setCurrentPath(pathParts.join('/'));
  }, [currentPath]);

  const handleObjectSelect = useCallback((objectKey: string) => {
    const newSelected = new Set(selectedObjects);
    if (newSelected.has(objectKey)) {
      newSelected.delete(objectKey);
    } else {
      newSelected.add(objectKey);
    }
    setSelectedObjects(newSelected);
  }, [selectedObjects]);

  const handleUpload = useCallback(async (files: File[]) => {
    if (!selectedBucket) return;

    for (const file of files) {
      const key = currentPath ? `${currentPath}/${file.name}` : file.name;
      try {
        await uploadObject({
          file,
          key,
          bucket: selectedBucket.name,
        });
        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    // Refresh objects list
    listObjects(selectedBucket.name, currentPath);
    setShowUploadDialog(false);
  }, [selectedBucket, currentPath, uploadObject, listObjects]);

  const handleDownload = useCallback(async (objectKey: string) => {
    if (!selectedBucket) return;

    try {
      await downloadObject({
        key: objectKey,
        bucket: selectedBucket.name,
      });
      toast.success(`Downloaded ${objectKey}`);
    } catch (error) {
      toast.error(`Failed to download ${objectKey}`);
    }
  }, [selectedBucket, downloadObject]);

  const handleDelete = useCallback(async (objectKey: string) => {
    if (!selectedBucket) return;

    try {
      await deleteObject(selectedBucket.name, objectKey);
      toast.success(`Deleted ${objectKey}`);
      listObjects(selectedBucket.name, currentPath);
    } catch (error) {
      toast.error(`Failed to delete ${objectKey}`);
    }
  }, [selectedBucket, deleteObject, listObjects, currentPath]);

  const handleCreateFolder = useCallback(async (folderName: string) => {
    if (!selectedBucket) return;

    const folderPath = currentPath ? `${currentPath}/${folderName}/` : `${folderName}/`;
    
    try {
      await createFolder(selectedBucket.name, folderPath);
      toast.success(`Created folder ${folderName}`);
      listObjects(selectedBucket.name, currentPath);
    } catch (error) {
      toast.error(`Failed to create folder ${folderName}`);
    }
  }, [selectedBucket, currentPath, createFolder, listObjects]);

  const filteredObjects = objects.filter(obj =>
    obj.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const folders = filteredObjects.filter(obj => obj.key.endsWith('/'));
  const files = filteredObjects.filter(obj => !obj.key.endsWith('/'));

  return (
    <div className="flex h-full">
      {/* Sidebar - Buckets */}
      <div className="w-64 border-r bg-muted/50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Storage Buckets</h3>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Usage Overview */}
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used</span>
                  <span>{formatBytes(usage.totalSize)}</span>
                </div>
                <Progress value={usage.quotaUsed} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{usage.objectCount} objects</span>
                  <span>{usage.bucketCount} buckets</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buckets List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {buckets.map((bucket) => (
                <Button
                  key={bucket.id}
                  variant={selectedBucket?.id === bucket.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleBucketSelect(bucket)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{bucket.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {bucket.objectCount} objects
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedBucket ? (
          <>
            {/* Toolbar */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold">{selectedBucket.name}</h2>
                  <Badge variant="secondary">{selectedBucket.status}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const folderName = prompt('Enter folder name:');
                      if (folderName) handleCreateFolder(folderName);
                    }}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </div>
              </div>

              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPath('')}
                  className="h-8 px-2"
                >
                  {selectedBucket.name}
                </Button>
                {currentPath.split('/').filter(Boolean).map((part, index, parts) => (
                  <React.Fragment key={index}>
                    <span className="text-muted-foreground">/</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPath(parts.slice(0, index + 1).join('/'))}
                      className="h-8 px-2"
                    >
                      {part}
                    </Button>
                  </React.Fragment>
                ))}
                {currentPath && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackClick}
                    className="h-8 px-2 ml-2"
                  >
                    ← Back
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Objects List */}
            <div className="flex-1 p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <ObjectsList
                  folders={folders}
                  files={files}
                  viewMode={viewMode}
                  selectedObjects={selectedObjects}
                  onFolderClick={handleFolderClick}
                  onObjectSelect={handleObjectSelect}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Bucket</h3>
              <p className="text-muted-foreground">
                Choose a bucket from the sidebar to browse its contents
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUpload={handleUpload}
        uploadProgress={uploadProgress}
      />
    </div>
  );
}

// Objects List Component
interface ObjectsListProps {
  folders: StorageObject[];
  files: StorageObject[];
  viewMode: 'grid' | 'list';
  selectedObjects: Set<string>;
  onFolderClick: (folderName: string) => void;
  onObjectSelect: (objectKey: string) => void;
  onDownload: (objectKey: string) => void;
  onDelete: (objectKey: string) => void;
}

function ObjectsList({
  folders,
  files,
  viewMode,
  selectedObjects,
  onFolderClick,
  onObjectSelect,
  onDownload,
  onDelete,
}: ObjectsListProps) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-4 gap-4">
        {folders.map((folder) => (
          <ObjectCard
            key={folder.key}
            object={folder}
            isSelected={selectedObjects.has(folder.key)}
            onSelect={() => onObjectSelect(folder.key)}
            onDoubleClick={() => onFolderClick(folder.key.replace('/', ''))}
            onDownload={() => onDownload(folder.key)}
            onDelete={() => onDelete(folder.key)}
          />
        ))}
        {files.map((file) => (
          <ObjectCard
            key={file.key}
            object={file}
            isSelected={selectedObjects.has(file.key)}
            onSelect={() => onObjectSelect(file.key)}
            onDownload={() => onDownload(file.key)}
            onDelete={() => onDelete(file.key)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {folders.map((folder) => (
        <ObjectRow
          key={folder.key}
          object={folder}
          isSelected={selectedObjects.has(folder.key)}
          onSelect={() => onObjectSelect(folder.key)}
          onDoubleClick={() => onFolderClick(folder.key.replace('/', ''))}
          onDownload={() => onDownload(folder.key)}
          onDelete={() => onDelete(folder.key)}
        />
      ))}
      {files.map((file) => (
        <ObjectRow
          key={file.key}
          object={file}
          isSelected={selectedObjects.has(file.key)}
          onSelect={() => onObjectSelect(file.key)}
          onDownload={() => onDownload(file.key)}
          onDelete={() => onDelete(file.key)}
        />
      ))}
    </div>
  );
}

// Object Card Component (Grid View)
interface ObjectCardProps {
  object: StorageObject;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick?: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function ObjectCard({ object, isSelected, onSelect, onDoubleClick, onDownload, onDelete }: ObjectCardProps) {
  const isFolder = object.key.endsWith('/');
  const fileName = object.key.split('/').pop() || object.key;

  return (
    <Card
      className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-2">
          {isFolder ? (
            <Folder className="h-8 w-8 text-blue-500" />
          ) : (
            <File className="h-8 w-8 text-gray-500" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium truncate w-full" title={fileName}>
              {fileName}
            </p>
            {!isFolder && (
              <p className="text-xs text-muted-foreground">
                {formatBytes(object.size)}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// Object Row Component (List View)
interface ObjectRowProps {
  object: StorageObject;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick?: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function ObjectRow({ object, isSelected, onSelect, onDoubleClick, onDownload, onDelete }: ObjectRowProps) {
  const isFolder = object.key.endsWith('/');
  const fileName = object.key.split('/').pop() || object.key;

  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 ${
        isSelected ? 'bg-muted' : ''
      }`}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      {isFolder ? (
        <Folder className="h-5 w-5 text-blue-500" />
      ) : (
        <File className="h-5 w-5 text-gray-500" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        {!isFolder && (
          <p className="text-xs text-muted-foreground">
            {formatBytes(object.size)} • {formatDate(object.lastModified)}
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Upload Dialog Component
interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => void;
  uploadProgress: number;
}

function UploadDialog({ open, onOpenChange, onUpload, uploadProgress }: UploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
    },
  });

  const handleUpload = () => {
    if (files.length > 0) {
      onUpload(files);
      setFiles([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Drag and drop files here or click to select files to upload.
          </DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <p>Drag & drop files here, or click to select files</p>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Files:</h4>
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="truncate">{file.name}</span>
                <span className="text-muted-foreground">{formatBytes(file.size)}</span>
              </div>
            ))}
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={files.length === 0}>
            Upload {files.length > 0 && `(${files.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
