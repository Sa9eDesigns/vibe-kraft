'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Rocket,
  Python,
  Server,
  Globe,
  Loader2,
  Play,
  CheckCircle,
  AlertCircle,
  Code,
  Package,
  Terminal,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type WorkspaceType = 'WEBVM' | 'FIRECRACKER' | 'PYODIDE';

interface UnifiedWorkspaceLauncherProps {
  userId: string;
  projectId: string;
  onLaunch?: (workspaceId: string, type: WorkspaceType) => void;
  className?: string;
}

interface WorkspaceConfig {
  name: string;
  description?: string;
  type: WorkspaceType;
  // WebVM specific
  diskImage?: string;
  // Firecracker specific
  image?: string;
  memory?: string;
  cpuCount?: number;
  diskSize?: string;
  // Pyodide specific
  pythonPackages?: string[];
  // Common
  environment?: Record<string, string>;
}

const workspaceTypes = {
  WEBVM: {
    name: 'WebVM',
    description: 'Browser-based Linux environment powered by CheerpX',
    icon: <Globe className="h-5 w-5" />,
    color: 'bg-blue-500',
    features: ['Full Linux environment', 'No server required', 'Instant startup', 'File persistence']
  },
  FIRECRACKER: {
    name: 'Firecracker',
    description: 'High-performance microVM with container support',
    icon: <Server className="h-5 w-5" />,
    color: 'bg-orange-500',
    features: ['Dedicated resources', 'Container support', 'Custom images', 'Network isolation']
  },
  PYODIDE: {
    name: 'Python',
    description: 'Python workspace powered by Pyodide in the browser',
    icon: <Python className="h-5 w-5" />,
    color: 'bg-green-500',
    features: ['Python 3.11 runtime', 'Scientific packages', 'Instant startup', 'No server needed']
  }
};

const defaultConfigs: Record<WorkspaceType, Partial<WorkspaceConfig>> = {
  WEBVM: {
    diskImage: 'wss://disks.webvm.io/debian_large_20230522_5044875331.ext2',
    environment: {
      WORKSPACE_TYPE: 'webvm'
    }
  },
  FIRECRACKER: {
    image: 'ubuntu:22.04',
    memory: '2GB',
    cpuCount: 2,
    diskSize: '10GB',
    environment: {
      WORKSPACE_TYPE: 'firecracker'
    }
  },
  PYODIDE: {
    pythonPackages: ['numpy', 'matplotlib', 'pandas'],
    environment: {
      WORKSPACE_TYPE: 'pyodide',
      PYTHON_VERSION: '3.11'
    }
  }
};

export function UnifiedWorkspaceLauncher({
  userId,
  projectId,
  onLaunch,
  className
}: UnifiedWorkspaceLauncherProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<WorkspaceType>('PYODIDE');
  const [config, setConfig] = useState<WorkspaceConfig>({
    name: '',
    type: 'PYODIDE',
    ...defaultConfigs.PYODIDE
  });
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);

  const handleTypeChange = useCallback((type: WorkspaceType) => {
    setSelectedType(type);
    setConfig(prev => ({
      ...prev,
      type,
      ...defaultConfigs[type]
    }));
  }, []);

  const handleLaunch = useCallback(async () => {
    if (!config.name.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    setIsLaunching(true);
    setLaunchProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setLaunchProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Create workspace
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          projectId,
          type: config.type,
          config: {
            workspaceConfig: config,
            environment: config.environment
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create workspace');
      }

      const { workspace } = await response.json();

      clearInterval(progressInterval);
      setLaunchProgress(100);

      toast.success('Workspace created successfully!');

      if (onLaunch) {
        onLaunch(workspace.id, config.type);
      } else {
        // Navigate based on workspace type
        if (config.type === 'PYODIDE') {
          router.push(`/workspace/pyodide/${workspace.id}`);
        } else {
          router.push(`/workspace/${workspace.id}`);
        }
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create workspace');
    } finally {
      setIsLaunching(false);
      setLaunchProgress(0);
    }
  }, [config, projectId, onLaunch, router]);

  return (
    <Card className={cn('w-full max-w-4xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Create New Workspace
        </CardTitle>
        <CardDescription>
          Choose a workspace type and configure your development environment
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Workspace Type Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Workspace Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(workspaceTypes).map(([type, info]) => (
              <Card
                key={type}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedType === type && 'ring-2 ring-primary'
                )}
                onClick={() => handleTypeChange(type as WorkspaceType)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg text-white', info.color)}>
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{info.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {info.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {info.features.slice(0, 2).map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {selectedType === type && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              placeholder="My Python Workspace"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description (Optional)</Label>
            <Textarea
              id="workspace-description"
              placeholder="Describe what you'll use this workspace for..."
              value={config.description || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Type-specific configuration */}
          {selectedType === 'PYODIDE' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium flex items-center gap-2">
                <Python className="h-4 w-4" />
                Python Configuration
              </h4>
              <div className="space-y-2">
                <Label>Pre-installed Packages</Label>
                <div className="flex flex-wrap gap-2">
                  {(config.pythonPackages || []).map((pkg) => (
                    <Badge key={pkg} variant="outline">
                      {pkg}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Additional packages can be installed using micropip in the workspace
                </p>
              </div>
            </div>
          )}

          {selectedType === 'FIRECRACKER' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                Firecracker Configuration
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Memory</Label>
                  <Select
                    value={config.memory}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, memory: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1GB">1GB</SelectItem>
                      <SelectItem value="2GB">2GB</SelectItem>
                      <SelectItem value="4GB">4GB</SelectItem>
                      <SelectItem value="8GB">8GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CPU Cores</Label>
                  <Select
                    value={config.cpuCount?.toString()}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, cpuCount: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Core</SelectItem>
                      <SelectItem value="2">2 Cores</SelectItem>
                      <SelectItem value="4">4 Cores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {selectedType === 'WEBVM' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                WebVM Configuration
              </h4>
              <p className="text-sm text-muted-foreground">
                WebVM workspaces use a pre-configured Debian environment with development tools.
                No additional configuration required.
              </p>
            </div>
          )}
        </div>

        {/* Launch Progress */}
        {isLaunching && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Creating workspace...</span>
              <span>{launchProgress}%</span>
            </div>
            <Progress value={launchProgress} className="h-2" />
          </div>
        )}

        {/* Launch Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleLaunch}
            disabled={isLaunching || !config.name.trim()}
            className="min-w-[140px]"
            size="lg"
          >
            {isLaunching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Create Workspace
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
