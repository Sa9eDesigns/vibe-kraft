/**
 * Firecracker Instances Hook
 * Custom React hooks for managing Firecracker WebVM instances
 */

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { WebVMInstance } from '@/lib/infrastructure/types';
import { CreateInstanceRequest, CommandResult } from '@/lib/infrastructure/services/firecracker';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// =============================================================================
// DATA FETCHING HOOKS
// =============================================================================

export function useFirecrackerInstances(userId?: string) {
  const queryParams = new URLSearchParams();
  if (userId) queryParams.append('userId', userId);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/infrastructure/firecracker?${queryParams.toString()}`,
    fetcher
  );

  return {
    instances: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useFirecrackerInstance(instanceId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    instanceId ? `/api/infrastructure/firecracker/${instanceId}` : null,
    fetcher
  );

  return {
    instance: data as WebVMInstance | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useFirecrackerInstanceLogs(instanceId?: string, lines: number = 100) {
  const { data, error, isLoading, mutate } = useSWR(
    instanceId ? `/api/infrastructure/firecracker/${instanceId}/logs?lines=${lines}` : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh logs every 5 seconds
    }
  );

  return {
    logs: data?.logs || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// =============================================================================
// INSTANCE MANAGEMENT HOOKS
// =============================================================================

export function useCreateFirecrackerInstance() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInstance = useCallback(async (data: CreateInstanceRequest): Promise<WebVMInstance> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/infrastructure/firecracker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Firecracker instance');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create Firecracker instance';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createInstance,
    isLoading,
    error,
  };
}

export function useFirecrackerInstanceControl() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controlInstance = useCallback(async (
    instanceId: string, 
    action: 'start' | 'stop' | 'restart'
  ): Promise<WebVMInstance> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/firecracker/${instanceId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} Firecracker instance`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} Firecracker instance`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startInstance = useCallback((instanceId: string) => 
    controlInstance(instanceId, 'start'), [controlInstance]);

  const stopInstance = useCallback((instanceId: string) => 
    controlInstance(instanceId, 'stop'), [controlInstance]);

  const restartInstance = useCallback((instanceId: string) => 
    controlInstance(instanceId, 'restart'), [controlInstance]);

  return {
    startInstance,
    stopInstance,
    restartInstance,
    isLoading,
    error,
  };
}

export function useDeleteFirecrackerInstance() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteInstance = useCallback(async (instanceId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/firecracker/${instanceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete Firecracker instance');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete Firecracker instance';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    deleteInstance,
    isLoading,
    error,
  };
}

export function useFirecrackerInstanceExec() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeCommand = useCallback(async (
    instanceId: string,
    command: string,
    timeout: number = 30000
  ): Promise<CommandResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/firecracker/${instanceId}/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, timeout }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute command');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute command';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    executeCommand,
    isLoading,
    error,
  };
}
