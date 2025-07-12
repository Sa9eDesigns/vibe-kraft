"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreHorizontal, 
  HardDrive, 
  Database, 
  Trash2, 
  Settings, 
  Download,
  Upload,
  FolderOpen,
  FileText,
  Archive,
  Shield,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface StorageBucket {
  id: string;
  name: string;
  region: string;
  size: number;
  objectCount: number;
  versioning: boolean;
  encryption: boolean;
  status: 'active' | 'suspended' | 'error';
  createdAt: string;
  updatedAt: string;
}

interface StorageStats {
  totalSize: number;
  totalObjects: number;
  totalBuckets: number;
  quota: number;
  quotaUsed: number;
}

interface StorageManagementProps {
  organizationId: string;
}

export function StorageManagement({ organizationId }: StorageManagementProps) {
  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchStorageData();
  }, [organizationId]);

  const fetchStorageData = async () => {
    try {
      setLoading(true);
      const [bucketsResponse, statsResponse] = await Promise.all([
        fetch(`/api/storage/buckets?organizationId=${organizationId}`),
        fetch(`/api/storage/stats?organizationId=${organizationId}`)
      ]);

      if (bucketsResponse.ok) {
        const bucketsData = await bucketsResponse.json();
        setBuckets(bucketsData);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch storage data:', error);
      toast.error('Failed to load storage data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBucket = async (bucketData: { name: string; region: string; versioning: boolean; encryption: boolean }) => {
    try {
      const response = await fetch('/api/storage/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bucketData, organizationId }),
      });

      if (response.ok) {
        toast.success('Storage bucket created successfully');
        setIsCreateDialogOpen(false);
        fetchStorageData();
      } else {
        throw new Error('Failed to create bucket');
      }
    } catch (error) {
      console.error('Error creating bucket:', error);
      toast.error('Failed to create storage bucket');
    }
  };

  const handleDeleteBucket = async (bucketId: string) => {
    try {
      const response = await fetch(`/api/storage/buckets/${bucketId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Storage bucket deleted successfully');
        fetchStorageData();
      } else {
        throw new Error('Failed to delete bucket');
      }
    } catch (error) {
      console.error('Error deleting bucket:', error);
      toast.error('Failed to delete storage bucket');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: StorageBucket['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Active</Badge>;
      case 'suspended':
        return <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" />Suspended</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Storage Management</CardTitle>
            <CardDescription>Loading storage data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.quotaUsed.toFixed(1)}% of quota used
              </p>
              <Progress value={stats.quotaUsed} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Objects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalObjects.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Files across all buckets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Buckets</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBuckets}</div>
              <p className="text-xs text-muted-foreground">
                Active storage buckets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Quota</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.quota)}</div>
              <p className="text-xs text-muted-foreground">
                Total allocated quota
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Storage Buckets Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage Buckets
            </CardTitle>
            <CardDescription>
              Manage MinIO storage buckets and configurations
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Bucket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Storage Bucket</DialogTitle>
                <DialogDescription>
                  Create a new MinIO storage bucket
                </DialogDescription>
              </DialogHeader>
              <BucketForm onSubmit={handleCreateBucket} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Objects</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buckets.map((bucket) => (
                <TableRow key={bucket.id}>
                  <TableCell>
                    <div className="font-medium">{bucket.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(bucket.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{bucket.region}</TableCell>
                  <TableCell>{formatBytes(bucket.size)}</TableCell>
                  <TableCell>{bucket.objectCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {bucket.versioning && (
                        <Badge variant="outline" className="text-xs">Versioning</Badge>
                      )}
                      {bucket.encryption && (
                        <Badge variant="outline" className="text-xs">Encrypted</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(bucket.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Browse Files
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Backup
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteBucket(bucket.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Bucket creation form
function BucketForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    region: 'us-east-1',
    versioning: false,
    encryption: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Bucket Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter bucket name"
          pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
          title="Bucket name must be lowercase, start and end with alphanumeric characters"
          required
        />
        <p className="text-xs text-muted-foreground">
          Must be lowercase, 3-63 characters, start and end with alphanumeric
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="region">Region</Label>
        <Input
          id="region"
          value={formData.region}
          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
          placeholder="us-east-1"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="versioning"
            checked={formData.versioning}
            onChange={(e) => setFormData({ ...formData, versioning: e.target.checked })}
            className="rounded border-gray-300"
          />
          <Label htmlFor="versioning">Enable versioning</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="encryption"
            checked={formData.encryption}
            onChange={(e) => setFormData({ ...formData, encryption: e.target.checked })}
            className="rounded border-gray-300"
          />
          <Label htmlFor="encryption">Enable encryption</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Create Bucket
        </Button>
      </div>
    </form>
  );
}
