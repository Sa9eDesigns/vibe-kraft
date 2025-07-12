import useSWR from 'swr';
import { useState } from 'react';
import { 
  CreateWorkspaceInput, 
  UpdateWorkspaceInput, 
  WorkspaceQueryInput,
  BulkUpdateWorkspacesInput 
} from '@/lib/validations/workspace';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWorkspaces(organizationId?: string, query?: WorkspaceQueryInput) {
  const queryParams = new URLSearchParams();
  if (organizationId) queryParams.append('organizationId', organizationId);
  if (query?.projectId) queryParams.append('projectId', query.projectId);
  if (query?.status) queryParams.append('status', query.status);
  if (query?.search) queryParams.append('search', query.search);
  if (query?.page) queryParams.append('page', query.page.toString());
  if (query?.limit) queryParams.append('limit', query.limit.toString());
  if (query?.sortBy) queryParams.append('sortBy', query.sortBy);
  if (query?.sortOrder) queryParams.append('sortOrder', query.sortOrder);

  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/workspaces?${queryParams.toString()}` : null,
    fetcher
  );

  return {
    workspaces: data?.workspaces || data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,
    totalPages: data?.totalPages || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useWorkspacesByProject(projectId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    projectId ? `/api/workspaces?projectId=${projectId}` : null,
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
    workspace: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCreateWorkspace() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWorkspace = async (data: CreateWorkspaceInput & { organizationId: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces?organizationId=${data.organizationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workspace');
      }

      const workspace = await response.json();
      return workspace;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createWorkspace,
    isLoading,
    error,
  };
}

export function useUpdateWorkspace() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateWorkspace = async (id: string, data: UpdateWorkspaceInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update workspace');
      }

      const workspace = await response.json();
      return workspace;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateWorkspace,
    isLoading,
    error,
  };
}

export function useDeleteWorkspace() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteWorkspace = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete workspace');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteWorkspace,
    isLoading,
    error,
  };
}

export function useBulkUpdateWorkspaces() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkUpdateWorkspaces = async (data: BulkUpdateWorkspacesInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/workspaces/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk update workspaces');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update workspaces';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    bulkUpdateWorkspaces,
    isLoading,
    error,
  };
}

export function useWorkspaceStats(organizationId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/dashboard/stats?organizationId=${organizationId}` : null,
    fetcher
  );

  return {
    stats: data?.workspaces,
    isLoading,
    isError: error,
    mutate,
  };
}
