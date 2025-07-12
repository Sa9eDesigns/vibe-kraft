/**
 * Firecracker Snapshots Hook
 * Custom React hooks for managing WebVM snapshots
 */

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { WebVMSnapshot, WebVMInstance } from '@/lib/infrastructure/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// =============================================================================
// DATA FETCHING HOOKS
// =============================================================================

export function useFirecrackerSnapshots(instanceId?: string) {
  const queryParams = new URLSearchParams();
  if (instanceId) queryParams.append('instanceId', instanceId);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/infrastructure/firecracker/snapshots?${queryParams.toString()}`,
    fetcher
  );

  return {
    snapshots: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// =============================================================================
// SNAPSHOT MANAGEMENT HOOKS
// =============================================================================

export interface CreateSnapshotRequest {
  instanceId: string;
  name: string;
  description?: string;
}

export function useCreateFirecrackerSnapshot() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSnapshot = useCallback(async (data: CreateSnapshotRequest): Promise<WebVMSnapshot> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/infrastructure/firecracker/snapshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create snapshot');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create snapshot';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createSnapshot,
    isLoading,
    error,
  };
}

export function useDeleteFirecrackerSnapshot() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSnapshot = useCallback(async (snapshotId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/firecracker/snapshots/${snapshotId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete snapshot');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete snapshot';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    deleteSnapshot,
    isLoading,
    error,
  };
}

export function useRestoreFirecrackerSnapshot() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restoreSnapshot = useCallback(async (snapshotId: string): Promise<WebVMInstance> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/firecracker/snapshots/${snapshotId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore snapshot');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore snapshot';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    restoreSnapshot,
    isLoading,
    error,
  };
}
