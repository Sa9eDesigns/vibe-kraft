import useSWR from 'swr';
import { useState } from 'react';
import { CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProjects(organizationId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/projects?organizationId=${organizationId}` : null,
    fetcher
  );

  return {
    projects: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useProject(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/projects/${id}` : null,
    fetcher
  );

  return {
    project: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCreateProject() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = async (data: CreateProjectInput & { organizationId: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const project = await response.json();
      return project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createProject,
    isLoading,
    error,
  };
}

export function useUpdateProject() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProject = async (id: string, data: UpdateProjectInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      const project = await response.json();
      return project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateProject,
    isLoading,
    error,
  };
}

export function useDeleteProject() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProject = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteProject,
    isLoading,
    error,
  };
}

export function useProjectStats(organizationId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/dashboard/stats?organizationId=${organizationId}` : null,
    fetcher
  );

  return {
    stats: data?.projects,
    isLoading,
    isError: error,
    mutate,
  };
}
