/**
 * Container Operations Hook
 * Custom hook for Docker container management operations
 */

import { useState, useCallback } from 'react';
import { Container, ContainerStats } from '@/lib/infrastructure/types';

interface UseContainerOperationsReturn {
  containers: Container[];
  containerStats: ContainerStats | null;
  loading: boolean;
  error: string | null;
  refreshContainers: () => Promise<void>;
  startContainer: (containerId: string) => Promise<void>;
  stopContainer: (containerId: string) => Promise<void>;
  restartContainer: (containerId: string) => Promise<void>;
  deleteContainer: (containerId: string) => Promise<void>;
  createContainer: (config: any) => Promise<void>;
  getContainerStats: (containerId: string) => Promise<void>;
  getContainerLogs: (containerId: string) => Promise<string[]>;
}

export function useContainerOperations(): UseContainerOperationsReturn {
  const [containers, setContainers] = useState<Container[]>([]);
  const [containerStats, setContainerStats] = useState<ContainerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshContainers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/infrastructure/docker/containers');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch containers: ${response.statusText}`);
      }

      const data = await response.json();
      setContainers(data.containers || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch containers';
      setError(errorMessage);
      console.error('Error fetching containers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const startContainer = useCallback(async (containerId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/docker/containers/${containerId}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to start container: ${response.statusText}`);
      }

      // Refresh containers list
      await refreshContainers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start container';
      setError(errorMessage);
      throw err;
    }
  }, [refreshContainers]);

  const stopContainer = useCallback(async (containerId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/docker/containers/${containerId}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to stop container: ${response.statusText}`);
      }

      // Refresh containers list
      await refreshContainers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop container';
      setError(errorMessage);
      throw err;
    }
  }, [refreshContainers]);

  const restartContainer = useCallback(async (containerId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/docker/containers/${containerId}/restart`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to restart container: ${response.statusText}`);
      }

      // Refresh containers list
      await refreshContainers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restart container';
      setError(errorMessage);
      throw err;
    }
  }, [refreshContainers]);

  const deleteContainer = useCallback(async (containerId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/docker/containers/${containerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete container: ${response.statusText}`);
      }

      // Refresh containers list
      await refreshContainers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete container';
      setError(errorMessage);
      throw err;
    }
  }, [refreshContainers]);

  const createContainer = useCallback(async (config: any) => {
    setError(null);

    try {
      const response = await fetch('/api/infrastructure/docker/containers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to create container: ${response.statusText}`);
      }

      // Refresh containers list
      await refreshContainers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create container';
      setError(errorMessage);
      throw err;
    }
  }, [refreshContainers]);

  const getContainerStats = useCallback(async (containerId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/docker/containers/${containerId}/stats`);
      
      if (!response.ok) {
        throw new Error(`Failed to get container stats: ${response.statusText}`);
      }

      const data = await response.json();
      setContainerStats(data.stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get container stats';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getContainerLogs = useCallback(async (containerId: string): Promise<string[]> => {
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/docker/containers/${containerId}/logs`);
      
      if (!response.ok) {
        throw new Error(`Failed to get container logs: ${response.statusText}`);
      }

      const data = await response.json();
      return data.logs || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get container logs';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    containers,
    containerStats,
    loading,
    error,
    refreshContainers,
    startContainer,
    stopContainer,
    restartContainer,
    deleteContainer,
    createContainer,
    getContainerStats,
    getContainerLogs,
  };
}
