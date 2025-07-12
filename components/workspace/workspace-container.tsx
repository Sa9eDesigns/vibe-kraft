'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceLayoutV2 } from '@/components/webvm/ui/workspace-layout-v2';
import { useDevSandbox } from '@/components/webvm/hooks/use-dev-sandbox';
import { LoadingSpinner } from '@/components/webvm/ui/loading-spinner';
import { ErrorDisplay } from '@/components/webvm/ui/error-display';
import { useCheerpXStatus } from '@/components/workspace/cheerpx-direct-loader';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Share } from 'lucide-react';
import { toast } from 'sonner';
import type { DevSandboxConfig, NetworkingConfig } from '@/components/webvm/types';

interface WorkspaceContainerProps {
  userId: string;
  projectId?: string;
  workspaceId?: string;
}

export function WorkspaceContainer({ userId, projectId, workspaceId }: WorkspaceContainerProps) {
  const router = useRouter();
  const cheerpXReady = useCheerpXStatus();
  const [isInitializing, setIsInitializing] = useState(true);
  const [workspaceConfig, setWorkspaceConfig] = useState<DevSandboxConfig | null>(null);
  const [networkingConfig, setNetworkingConfig] = useState<NetworkingConfig>({
    tailscale: { enabled: false, authKey: '' },
    ssh: { enabled: false, keyPath: '', knownHosts: [] },
    portForwarding: { enabled: false, ports: [] }
  });
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  // Initialize workspace configuration
  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        setIsInitializing(true);

        // Wait for CheerpX to be ready
        console.log('🔍 Waiting for CheerpX to be ready...');

        if (!cheerpXReady) {
          // Wait for CheerpX with timeout
          let attempts = 0;
          const maxAttempts = 100; // 10 seconds

          while (attempts < maxAttempts && !cheerpXReady) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;

            if (attempts % 10 === 0) {
              console.log(`⏳ Still waiting for CheerpX... (${attempts/10}s)`);
            }

            // Check if it became ready
            if ((window as any).__CHEERPX_READY__ && (window as any).CheerpX) {
              break;
            }
          }
        }

        // Final check
        if (!(window as any).CheerpX) {
          console.error('❌ CheerpX failed to load');
          console.error('Debug info:');
          console.error('- SharedArrayBuffer available:', typeof SharedArrayBuffer !== 'undefined');
          console.error('- crossOriginIsolated:', (window as any).crossOriginIsolated);
          console.error('- __CHEERPX_READY__ flag:', !!(window as any).__CHEERPX_READY__);

          throw new Error('CheerpX failed to load. Please check the browser console for details and refresh the page.');
        }

        console.log('✅ CheerpX is ready!');

        // Load workspace data if workspaceId is provided
        if (workspaceId) {
          const response = await fetch(`/api/workspaces/${workspaceId}`);
          if (response.ok) {
            const data = await response.json();
            setWorkspaceData(data);
            if (data.config?.workspaceConfig) {
              setWorkspaceConfig(data.config.workspaceConfig);
            }
            if (data.config?.networkingConfig) {
              setNetworkingConfig(data.config.networkingConfig);
            }
          }
        }

        // Load project data if projectId is provided
        if (projectId && !workspaceId) {
          const response = await fetch(`/api/projects/${projectId}`);
          if (response.ok) {
            const project = await response.json();
            // Create workspace config based on project
            const config = createWorkspaceConfigForProject(project);
            setWorkspaceConfig(config);
          }
        }

        // Default configuration if no specific workspace or project
        if (!workspaceConfig && !projectId && !workspaceId) {
          setWorkspaceConfig(getDefaultWorkspaceConfig());
        }

      } catch (error) {
        console.error('Failed to initialize workspace:', error);
        toast.error('Failed to initialize workspace');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeWorkspace();
  }, [projectId, workspaceId]);

  const { sandbox, isLoading, error, initialize } = useDevSandbox(workspaceConfig || getDefaultWorkspaceConfig());

  const handleSaveWorkspace = useCallback(async () => {
    if (!sandbox || !workspaceConfig) return;

    try {
      const workspaceState = {
        name: workspaceData?.name || (projectId ? 'Project Workspace' : 'WebVM Workspace'),
        description: workspaceData?.description,
        projectId: projectId || workspaceData?.projectId,
        config: {
          workspaceConfig,
          networkingConfig,
        },
      };

      if (workspaceId) {
        // Update existing workspace
        const response = await fetch(`/api/workspaces/${workspaceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workspaceState),
        });

        if (response.ok) {
          toast.success('Workspace updated successfully');
        } else {
          throw new Error('Failed to update workspace');
        }
      } else if (projectId) {
        // Create new workspace for project
        // First get the project to find the organization
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (projectResponse.ok) {
          const project = await projectResponse.json();
          const organizationId = project.organization.id;

          const response = await fetch(`/api/workspaces?organizationId=${organizationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workspaceState),
          });

          if (response.ok) {
            const savedWorkspace = await response.json();
            router.replace(`/workspace?workspaceId=${savedWorkspace.id}`);
            toast.success('Workspace created successfully');
          } else {
            throw new Error('Failed to create workspace');
          }
        }
      }
    } catch (error) {
      console.error('Failed to save workspace:', error);
      toast.error('Failed to save workspace');
    }
  }, [sandbox, workspaceConfig, networkingConfig, projectId, workspaceId, workspaceData, router]);

  const handleShareWorkspace = useCallback(async () => {
    if (!workspaceId) {
      toast.error('Please save the workspace first');
      return;
    }

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/workspace?workspaceId=${workspaceId}`);
      toast.success('Workspace link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy workspace link');
    }
  }, [workspaceId]);

  const handleNetworkingChange = useCallback((newConfig: NetworkingConfig) => {
    setNetworkingConfig(newConfig);
  }, []);

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Initializing Workspace</CardTitle>
            <CardDescription>Loading CheerpX WebVM and setting up your development environment...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoadingSpinner />
            <div className="text-sm text-muted-foreground text-center">
              This may take a few moments on first load
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Workspace Error</CardTitle>
            <CardDescription>Failed to initialize the workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ErrorDisplay error={error} />
            <div className="flex gap-2">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Workspace Header */}
      <div className="flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-sm font-medium">
            {workspaceData?.name || (projectId ? 'Project Workspace' : 'WebVM Workspace')}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveWorkspace}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareWorkspace}
            disabled={!workspaceId}
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : sandbox ? (
          <WorkspaceLayoutV2
            sandbox={sandbox}
            className="h-full"
            networkingConfig={networkingConfig}
            onNetworkingChange={handleNetworkingChange}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Workspace Not Ready</CardTitle>
                <CardDescription>The workspace is not yet ready for use</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={initialize}>
                  Initialize Workspace
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getDefaultWorkspaceConfig(): DevSandboxConfig {
  return {
    diskImage: 'wss://disks.webvm.io/debian_large_20230522_5044875331.ext2',
    mounts: [
      { type: 'ext2', path: '/', dev: 'overlay' },
      { type: 'dir', path: '/workspace', dev: 'web' },
      { type: 'dir', path: '/data', dev: 'data' }
    ],
    aiProvider: 'openai',
    aiConfig: {
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      model: 'gpt-4',
      tools: [],
      capabilities: {
        terminalControl: true,
        visualInterface: true,
        codeGeneration: true,
        debugging: true,
        fileSystemAccess: true
      },
      safety: {
        confirmActions: true,
        restrictedCommands: ['rm -rf /', 'dd', 'mkfs'],
        maxExecutionTime: 30000
      }
    },
    editor: 'monaco',
    theme: 'auto',
    layout: {
      defaultLayout: 'horizontal',
      panels: [
        { type: 'fileExplorer', size: 20 },
        { type: 'editor', size: 50 },
        { type: 'terminal', size: 30 }
      ],
      resizable: true,
      collapsible: true
    },
    crossOriginIsolation: true,
    allowedOrigins: ['*']
  };
}

function createWorkspaceConfigForProject(project: any): DevSandboxConfig {
  const baseConfig = getDefaultWorkspaceConfig();

  // Customize config based on project type or requirements
  // For example, different disk images or mount points based on project type
  const customizations: Partial<DevSandboxConfig> = {};

  if (project.type === 'nodejs') {
    customizations.mounts = [
      ...baseConfig.mounts,
      { type: 'dir', path: '/node_modules', dev: 'web' }
    ];
  } else if (project.type === 'python') {
    customizations.mounts = [
      ...baseConfig.mounts,
      { type: 'dir', path: '/venv', dev: 'web' }
    ];
  }

  return {
    ...baseConfig,
    ...customizations,
  };
}
