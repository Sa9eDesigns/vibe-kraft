import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface WorkspaceConfig {
  diskImage: string;
  mounts: Array<{
    type: string;
    path: string;
    dev: string;
  }>;
  aiProvider: string;
  aiConfig: {
    apiKey: string;
    model: string;
    tools: any[];
    capabilities: {
      terminalControl: boolean;
      visualInterface: boolean;
      codeGeneration: boolean;
      debugging: boolean;
      fileSystemAccess: boolean;
    };
    safety: {
      confirmActions: boolean;
      restrictedCommands: string[];
      maxExecutionTime: number;
    };
  };
  editor: string;
  theme: string;
  layout: {
    defaultLayout: string;
    panels: Array<{
      type: string;
      size: number;
    }>;
    resizable: boolean;
    collapsible: boolean;
  };
  crossOriginIsolation: boolean;
  allowedOrigins?: string[];
}

export interface NetworkingConfig {
  tailscale: {
    enabled: boolean;
    authKey: string;
  };
  ssh: {
    enabled: boolean;
    keyPath: string;
    knownHosts: string[];
  };
  portForwarding: {
    enabled: boolean;
    ports: Array<{
      local: number;
      remote: number;
      protocol?: string;
    }>;
  };
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'ERROR';
  config?: {
    workspaceConfig: WorkspaceConfig;
    networkingConfig?: NetworkingConfig;
  };
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    organization: {
      id: string;
      name: string;
    };
  };
  instances?: Array<{
    id: string;
    name: string;
    status: string;
    connectionUrl?: string;
    createdAt: string;
    startedAt?: string;
  }>;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  projectId: string;
  config: {
    workspaceConfig: WorkspaceConfig;
    networkingConfig?: NetworkingConfig;
  };
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  config?: {
    workspaceConfig: WorkspaceConfig;
    networkingConfig?: NetworkingConfig;
  };
}

export function useWorkspaces(organizationId?: string, projectId?: string) {
  const queryParams = new URLSearchParams();
  if (organizationId) queryParams.append('organizationId', organizationId);
  if (projectId) queryParams.append('projectId', projectId);

  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/workspaces?${queryParams.toString()}` : null,
    fetcher
  );

  return {
    workspaces: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useWorkspace(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/workspaces/${id}` : null,
    fetcher
  );

  return {
    workspace: data as Workspace | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useWorkspaceActions() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createWorkspace = useCallback(async (
    organizationId: string,
    workspaceData: CreateWorkspaceInput
  ): Promise<Workspace | null> => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/workspaces?organizationId=${organizationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workspaceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create workspace');
      }

      const workspace = await response.json();
      toast.success('Workspace created successfully');
      return workspace;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create workspace';
      toast.error(message);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateWorkspace = useCallback(async (
    id: string,
    workspaceData: UpdateWorkspaceInput
  ): Promise<Workspace | null> => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workspaceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update workspace');
      }

      const workspace = await response.json();
      toast.success('Workspace updated successfully');
      return workspace;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update workspace';
      toast.error(message);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteWorkspace = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete workspace');
      }

      toast.success('Workspace deleted successfully');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete workspace';
      toast.error(message);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const launchWorkspace = useCallback(async (workspaceId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/launch`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to launch workspace');
      }

      const result = await response.json();

      if (result.status === 'STARTING') {
        toast.success('Workspace is starting up...');
      } else {
        toast.success('Workspace launched successfully');
      }

      return result.url || `/workspace?workspaceId=${workspaceId}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to launch workspace';
      toast.error(message);
      return null;
    }
  }, []);

  const stopWorkspace = useCallback(async (workspaceId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/launch`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stop workspace');
      }

      toast.success('Workspace stopped successfully');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop workspace';
      toast.error(message);
      return false;
    }
  }, []);

  const getWorkspaceStatus = useCallback(async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/launch`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get workspace status');
      }

      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get workspace status';
      console.error(message);
      return null;
    }
  }, []);

  return {
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    launchWorkspace,
    stopWorkspace,
    getWorkspaceStatus,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
