/**
 * Docker Infrastructure Hooks
 * Custom React hooks for managing Docker containers
 */

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { Container, ContainerStats } from '@/lib/infrastructure/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// =============================================================================
// DATA FETCHING HOOKS
// =============================================================================

export function useDockerContainers() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/infrastructure/docker',
    fetcher
  );

  return {
    containers: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useDockerContainer(containerId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    containerId ? `/api/infrastructure/docker/${containerId}` : null,
    fetcher
  );

  return {
    container: data as Container | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useDockerContainerStats(containerId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    containerId ? `/api/infrastructure/docker/${containerId}/stats` : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh stats every 5 seconds
    }
  );

  return {
    stats: data as ContainerStats | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

// =============================================================================
// CONTAINER MANAGEMENT HOOKS
// =============================================================================

export interface CreateContainerRequest {
  image: string;
  name?: string;
  environment?: Record<string, string>;
  ports?: Record<string, number>;
  volumes?: Record<string, string>;
  command?: string[];
  workingDir?: string;
  user?: string;
  labels?: Record<string, string>;
}

export function useCreateDockerContainer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createContainer = useCallback(async (data: CreateContainerRequest): Promise<Container> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/infrastructure/docker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create container');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create container';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createContainer,
    isLoading,
    error,
  };
}

export function useDockerContainerControl() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controlContainer = useCallback(async (
    containerId: string, 
    action: 'start' | 'stop'
  ): Promise<Container> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/docker/${containerId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} container`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} container`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startContainer = useCallback((containerId: string) => 
    controlContainer(containerId, 'start'), [controlContainer]);

  const stopContainer = useCallback((containerId: string) => 
    controlContainer(containerId, 'stop'), [controlContainer]);

  return {
    startContainer,
    stopContainer,
    isLoading,
    error,
  };
}

export function useDeleteDockerContainer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteContainer = useCallback(async (containerId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/docker/${containerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete container');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete container';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    deleteContainer,
    isLoading,
    error,
  };
}

// =============================================================================
// COMPREHENSIVE DOCKER HOOK
// =============================================================================

export interface UseDockerOptions {
  containerId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useDocker(options: UseDockerOptions = {}) {
  const { containerId } = options;

  // Data hooks
  const containers = useDockerContainers();
  const container = useDockerContainer(containerId);
  const stats = useDockerContainerStats(containerId);

  // Action hooks
  const createContainer = useCreateDockerContainer();
  const containerControl = useDockerContainerControl();
  const deleteContainer = useDeleteDockerContainer();

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      containers.mutate(),
      container.mutate(),
      stats.mutate(),
    ]);
  }, [containers, container, stats]);

  // Check if any operation is loading
  const isLoading = 
    containers.isLoading ||
    container.isLoading ||
    stats.isLoading ||
    createContainer.isLoading ||
    containerControl.isLoading ||
    deleteContainer.isLoading;

  // Collect all errors
  const errors = [
    containers.isError,
    container.isError,
    stats.isError,
    createContainer.error,
    containerControl.error,
    deleteContainer.error,
  ].filter(Boolean);

  return {
    // Data
    containers: containers.containers,
    container: container.container,
    stats: stats.stats,

    // Actions
    createContainer: createContainer.createContainer,
    startContainer: containerControl.startContainer,
    stopContainer: containerControl.stopContainer,
    deleteContainer: deleteContainer.deleteContainer,

    // State
    isLoading,
    errors,
    hasErrors: errors.length > 0,

    // Refresh
    refreshAll,
    refreshContainers: containers.mutate,
    refreshContainer: container.mutate,
    refreshStats: stats.mutate,
  };
}
