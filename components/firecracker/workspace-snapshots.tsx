/**
 * Firecracker Workspace Snapshots
 * Snapshot management for Firecracker instances
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Camera,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  MoreHorizontal,
  Plus,
  Clock,
  HardDrive,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileImage,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { useFirecracker } from '@/hooks/use-firecracker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface WorkspaceSnapshotsProps {
  instanceId: string;
  className?: string;
}

interface CreateSnapshotData {
  name: string;
  description: string;
}

// Mock snapshots data
const mockSnapshots = [
  {
    id: 'snap-1',
    instanceId: 'instance-1',
    name: 'Initial Setup',
    description: 'Fresh Ubuntu installation with basic tools',
    size: 1024 * 1024 * 1024 * 2.5, // 2.5 GB
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
  },
  {
    id: 'snap-2',
    instanceId: 'instance-1',
    name: 'Development Environment',
    description: 'Node.js, Python, and development tools installed',
    size: 1024 * 1024 * 1024 * 4.2, // 4.2 GB
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    id: 'snap-3',
    instanceId: 'instance-1',
    name: 'Project Checkpoint',
    description: 'Before major refactoring - backup point',
    size: 1024 * 1024 * 1024 * 3.8, // 3.8 GB
    createdAt: new Date(Date.now() - 3600000 * 6), // 6 hours ago
  },
];

export function WorkspaceSnapshots({ instanceId, className }: WorkspaceSnapshotsProps) {
  const [snapshots, setSnapshots] = useState(mockSnapshots);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteSnapshotId, setDeleteSnapshotId] = useState<string | null>(null);
  const [restoreSnapshotId, setRestoreSnapshotId] = useState<string | null>(null);
  const [createData, setCreateData] = useState<CreateSnapshotData>({
    name: '',
    description: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const {
    createSnapshot,
    deleteSnapshot,
    restoreSnapshot,
    refreshAll,
  } = useFirecracker({ instanceId });

  const formatFileSize = useCallback((bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const handleCreateSnapshot = useCallback(async () => {
    if (!createData.name.trim()) {
      toast.error('Please provide a snapshot name');
      return;
    }

    setIsCreating(true);
    try {
      const snapshot = await createSnapshot({
        instanceId,
        name: createData.name,
        description: createData.description,
      });

      // Add to local state (in real app, this would come from API)
      const newSnapshot = {
        id: `snap-${Date.now()}`,
        instanceId,
        name: createData.name,
        description: createData.description,
        size: Math.floor(Math.random() * 1024 * 1024 * 1024 * 5), // Random size
        createdAt: new Date(),
      };

      setSnapshots(prev => [newSnapshot, ...prev]);
      setShowCreateDialog(false);
      setCreateData({ name: '', description: '' });
      toast.success('Snapshot created successfully');
      refreshAll();
    } catch (error) {
      toast.error(`Failed to create snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  }, [createData, instanceId, createSnapshot, refreshAll]);

  const handleDeleteSnapshot = useCallback(async (snapshotId: string) => {
    try {
      await deleteSnapshot(snapshotId);
      setSnapshots(prev => prev.filter(s => s.id !== snapshotId));
      setDeleteSnapshotId(null);
      toast.success('Snapshot deleted successfully');
      refreshAll();
    } catch (error) {
      toast.error(`Failed to delete snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [deleteSnapshot, refreshAll]);

  const handleRestoreSnapshot = useCallback(async (snapshotId: string) => {
    setIsRestoring(true);
    try {
      await restoreSnapshot(snapshotId);
      setRestoreSnapshotId(null);
      toast.success('Snapshot restored successfully');
      refreshAll();
    } catch (error) {
      toast.error(`Failed to restore snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRestoring(false);
    }
  }, [restoreSnapshot, refreshAll]);

  const totalSnapshotSize = snapshots.reduce((total, snapshot) => total + snapshot.size, 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Snapshots</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage instance snapshots for backup and restore
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Camera className="h-4 w-4 mr-2" />
                Create Snapshot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Snapshot</DialogTitle>
                <DialogDescription>
                  Create a point-in-time snapshot of your workspace instance
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="snapshot-name">Snapshot Name</Label>
                  <Input
                    id="snapshot-name"
                    placeholder="e.g., Before major update"
                    value={createData.name}
                    onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="snapshot-description">Description (Optional)</Label>
                  <Textarea
                    id="snapshot-description"
                    placeholder="Describe what this snapshot contains..."
                    value={createData.description}
                    onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateSnapshot} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Create Snapshot
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Snapshots</p>
                <p className="text-2xl font-bold">{snapshots.length}</p>
              </div>
              <FileImage className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">{formatFileSize(totalSnapshotSize)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Latest Snapshot</p>
                <p className="text-lg font-bold">
                  {snapshots.length > 0 
                    ? formatDistanceToNow(new Date(Math.max(...snapshots.map(s => s.createdAt.getTime())))) + ' ago'
                    : 'None'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Snapshots List */}
      {snapshots.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Snapshots Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first snapshot to backup your workspace state
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Camera className="h-4 w-4 mr-2" />
              Create First Snapshot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {snapshots.map((snapshot) => (
            <Card key={snapshot.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <Archive className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{snapshot.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {snapshot.description || 'No description provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-4 w-4" />
                        {formatFileSize(snapshot.size)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(snapshot.createdAt, 'PPp')}
                      </div>
                      <Badge variant="outline">
                        {formatDistanceToNow(snapshot.createdAt)} ago
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRestoreSnapshotId(snapshot.id)}
                      disabled={isRestoring}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setRestoreSnapshotId(snapshot.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteSnapshotId(snapshot.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSnapshotId} onOpenChange={() => setDeleteSnapshotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snapshot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this snapshot? This action cannot be undone.
              You will lose this backup point permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSnapshotId && handleDeleteSnapshot(deleteSnapshotId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Snapshot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreSnapshotId} onOpenChange={() => setRestoreSnapshotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Snapshot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this snapshot? This will replace the current
              state of your workspace with the snapshot data. Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreSnapshotId && handleRestoreSnapshot(restoreSnapshotId)}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Snapshot
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
