/**
 * Firecracker Workspace Launcher
 * Component for creating and launching Firecracker-powered workspaces
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Rocket,
  Settings,
  Template,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Shield,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
  Play,
  Code,
  Database,
  Globe,
  Terminal
} from 'lucide-react';
import { useFirecracker } from '@/hooks/use-firecracker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkspaceLauncherProps {
  userId: string;
  workspaceId?: string;
  onLaunch?: (instanceId: string) => void;
  className?: string;
}

interface LaunchConfig {
  name: string;
  description?: string;
  templateId?: string;
  image: string;
  memory: string;
  cpuCount: number;
  diskSize: string;
  vnc: boolean;
  environment: Record<string, string>;
  ports: number[];
  autoStart: boolean;
}

const defaultConfig: LaunchConfig = {
  name: '',
  image: 'ubuntu:22.04',
  memory: '2GB',
  cpuCount: 2,
  diskSize: '10GB',
  vnc: false,
  environment: {},
  ports: [22, 3000, 8080],
  autoStart: true,
};

const presetConfigs = {
  development: {
    name: 'Development Environment',
    description: 'Full-stack development with Node.js, Python, and common tools',
    image: 'vibecraft/dev:latest',
    memory: '4GB',
    cpuCount: 4,
    diskSize: '20GB',
    environment: {
      NODE_VERSION: '18',
      PYTHON_VERSION: '3.11',
      WORKSPACE_TYPE: 'development'
    },
    ports: [22, 3000, 3001, 8080, 8000, 5000],
  },
  datascience: {
    name: 'Data Science Lab',
    description: 'Jupyter, pandas, scikit-learn, and ML tools',
    image: 'vibecraft/datascience:latest',
    memory: '8GB',
    cpuCount: 4,
    diskSize: '30GB',
    environment: {
      JUPYTER_ENABLE: 'true',
      PYTHON_VERSION: '3.11',
      WORKSPACE_TYPE: 'datascience'
    },
    ports: [22, 8888, 8000, 6006],
  },
  web: {
    name: 'Web Development',
    description: 'Frontend and backend web development tools',
    image: 'vibecraft/web:latest',
    memory: '2GB',
    cpuCount: 2,
    diskSize: '15GB',
    environment: {
      NODE_VERSION: '18',
      WORKSPACE_TYPE: 'web'
    },
    ports: [22, 3000, 3001, 8080, 5173],
  },
  minimal: {
    name: 'Minimal Ubuntu',
    description: 'Basic Ubuntu environment for custom setups',
    image: 'ubuntu:22.04',
    memory: '1GB',
    cpuCount: 1,
    diskSize: '5GB',
    environment: {
      WORKSPACE_TYPE: 'minimal'
    },
    ports: [22],
  },
};

export function WorkspaceLauncher({ userId, workspaceId, onLaunch, className }: WorkspaceLauncherProps) {
  const router = useRouter();
  const [config, setConfig] = useState<LaunchConfig>(defaultConfig);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { createInstance, templates } = useFirecracker();

  const handlePresetSelect = useCallback((presetKey: string) => {
    if (presetKey && presetConfigs[presetKey as keyof typeof presetConfigs]) {
      const preset = presetConfigs[presetKey as keyof typeof presetConfigs];
      setConfig(prev => ({
        ...prev,
        ...preset,
        name: prev.name || preset.name,
      }));
      setSelectedPreset(presetKey);
    }
  }, []);

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setConfig(prev => ({
        ...prev,
        templateId,
        image: template.image,
        memory: template.memory,
        cpuCount: template.cpuCount,
        diskSize: template.diskSize,
      }));
    }
  }, [templates]);

  const handleLaunch = useCallback(async () => {
    if (!config.name.trim()) {
      toast.error('Please provide a workspace name');
      return;
    }

    setIsLaunching(true);
    setLaunchProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setLaunchProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const instance = await createInstance({
        userId,
        workspaceId: workspaceId || `ws-${Date.now()}`,
        image: config.image,
        memory: config.memory,
        cpuCount: config.cpuCount,
        diskSize: config.diskSize,
        vnc: config.vnc,
        environment: config.environment,
        metadata: {
          name: config.name,
          description: config.description,
          preset: selectedPreset,
          ports: config.ports,
        },
      });

      clearInterval(progressInterval);
      setLaunchProgress(100);

      toast.success('Workspace launched successfully!');
      
      if (onLaunch) {
        onLaunch(instance.id);
      } else {
        router.push(`/workspace/${instance.id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to launch workspace');
    } finally {
      setIsLaunching(false);
      setLaunchProgress(0);
    }
  }, [config, userId, workspaceId, selectedPreset, createInstance, onLaunch, router]);

  return (
    <Card className={cn('w-full max-w-4xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Launch Firecracker Workspace
        </CardTitle>
        <CardDescription>
          Create a new high-performance workspace powered by Firecracker microVMs
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Quick Start</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  placeholder="My Development Environment"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Choose a Preset</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(presetConfigs).map(([key, preset]) => (
                    <Card
                      key={key}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md',
                        selectedPreset === key && 'ring-2 ring-primary'
                      )}
                      onClick={() => handlePresetSelect(key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {key === 'development' && <Code className="h-4 w-4" />}
                            {key === 'datascience' && <Database className="h-4 w-4" />}
                            {key === 'web' && <Globe className="h-4 w-4" />}
                            {key === 'minimal' && <Terminal className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{preset.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {preset.description}
                            </p>
                            <div className="flex gap-1 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {preset.memory}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {preset.cpuCount} CPU
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            {templates && templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      config.templateId === template.id && 'ring-2 ring-primary'
                    )}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Template className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <div className="flex gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {template.memory}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.cpuCount} CPU
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Template className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
                <p className="text-muted-foreground">
                  Create custom templates to quickly launch pre-configured workspaces
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-name">Workspace Name</Label>
                  <Input
                    id="custom-name"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Container Image</Label>
                  <Input
                    id="image"
                    value={config.image}
                    onChange={(e) => setConfig(prev => ({ ...prev, image: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={config.description || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Memory: {config.memory}</Label>
                  <Select
                    value={config.memory}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, memory: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="512MB">512MB</SelectItem>
                      <SelectItem value="1GB">1GB</SelectItem>
                      <SelectItem value="2GB">2GB</SelectItem>
                      <SelectItem value="4GB">4GB</SelectItem>
                      <SelectItem value="8GB">8GB</SelectItem>
                      <SelectItem value="16GB">16GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>CPU Cores: {config.cpuCount}</Label>
                  <Slider
                    value={[config.cpuCount]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, cpuCount: value }))}
                    min={1}
                    max={8}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Disk Size</Label>
                  <Select
                    value={config.diskSize}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, diskSize: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5GB">5GB</SelectItem>
                      <SelectItem value="10GB">10GB</SelectItem>
                      <SelectItem value="20GB">20GB</SelectItem>
                      <SelectItem value="50GB">50GB</SelectItem>
                      <SelectItem value="100GB">100GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="vnc"
                    checked={config.vnc}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, vnc: checked }))}
                  />
                  <Label htmlFor="vnc">Enable VNC Access</Label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {isLaunching && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <div className="space-y-2">
                <div>Launching workspace...</div>
                <Progress value={launchProgress} className="w-full" />
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            Powered by Firecracker microVMs
          </div>
          
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Advanced Configuration</DialogTitle>
                  <DialogDescription>
                    Configure advanced settings for your workspace
                  </DialogDescription>
                </DialogHeader>
                {/* Advanced settings content would go here */}
              </DialogContent>
            </Dialog>

            <Button 
              onClick={handleLaunch} 
              disabled={isLaunching || !config.name.trim()}
              className="min-w-[120px]"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Launch
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
