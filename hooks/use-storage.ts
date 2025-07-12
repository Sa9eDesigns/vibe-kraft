/**
 * Storage Infrastructure Hooks
 * Custom React hooks for managing storage buckets and objects
 */

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { StorageBucket, StorageObject } from '@/lib/infrastructure/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// =============================================================================
// DATA FETCHING HOOKS
// =============================================================================

export function useStorageBuckets() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/infrastructure/storage',
    fetcher
  );

  return {
    buckets: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useStorageObjects(bucketName?: string, prefix?: string) {
  const queryParams = new URLSearchParams();
  if (prefix) queryParams.append('prefix', prefix);

  const { data, error, isLoading, mutate } = useSWR(
    bucketName ? `/api/infrastructure/storage/${bucketName}/objects?${queryParams.toString()}` : null,
    fetcher
  );

  return {
    objects: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// =============================================================================
// BUCKET MANAGEMENT HOOKS
// =============================================================================

export interface CreateBucketRequest {
  name: string;
  region?: string;
}

export function useCreateStorageBucket() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBucket = useCallback(async (data: CreateBucketRequest): Promise<StorageBucket> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/infrastructure/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create bucket');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bucket';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createBucket,
    isLoading,
    error,
  };
}

export function useDeleteStorageBucket() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteBucket = useCallback(async (bucketName: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/storage/${bucketName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete bucket');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete bucket';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    deleteBucket,
    isLoading,
    error,
  };
}

// =============================================================================
// OBJECT MANAGEMENT HOOKS
// =============================================================================

export interface UploadObjectRequest {
  file: File;
  key: string;
  bucketName: string;
}

export function useUploadStorageObject() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadObject = useCallback(async (data: UploadObjectRequest): Promise<StorageObject> => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('key', data.key);

      const response = await fetch(`/api/infrastructure/storage/${data.bucketName}/objects`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload object');
      }

      const result = await response.json();
      setProgress(100);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload object';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    uploadObject,
    isLoading,
    error,
    progress,
  };
}

export function useDownloadStorageObject() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadObject = useCallback(async (bucketName: string, objectKey: string): Promise<Blob> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/storage/${bucketName}/objects/${encodeURIComponent(objectKey)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download object');
      }

      const blob = await response.blob();
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download object';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    downloadObject,
    isLoading,
    error,
  };
}

export function useDeleteStorageObject() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteObject = useCallback(async (bucketName: string, objectKey: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/storage/${bucketName}/objects/${encodeURIComponent(objectKey)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete object');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete object';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    deleteObject,
    isLoading,
    error,
  };
}

// =============================================================================
// COMPREHENSIVE STORAGE HOOK
// =============================================================================

export interface UseStorageOptions {
  bucketName?: string;
  prefix?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useStorage(options: UseStorageOptions = {}) {
  const { bucketName, prefix } = options;

  // Data hooks
  const buckets = useStorageBuckets();
  const objects = useStorageObjects(bucketName, prefix);

  // Action hooks
  const createBucket = useCreateStorageBucket();
  const deleteBucket = useDeleteStorageBucket();
  const uploadObject = useUploadStorageObject();
  const downloadObject = useDownloadStorageObject();
  const deleteObject = useDeleteStorageObject();

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      buckets.mutate(),
      objects.mutate(),
    ]);
  }, [buckets.mutate, objects.mutate]);

  // Check if any operation is loading
  const isLoading = 
    buckets.isLoading ||
    objects.isLoading ||
    createBucket.isLoading ||
    deleteBucket.isLoading ||
    uploadObject.isLoading ||
    downloadObject.isLoading ||
    deleteObject.isLoading;

  // Collect all errors
  const errors = [
    buckets.isError,
    objects.isError,
    createBucket.error,
    deleteBucket.error,
    uploadObject.error,
    downloadObject.error,
    deleteObject.error,
  ].filter(Boolean);

  return {
    // Data
    buckets: buckets.buckets,
    objects: objects.objects,

    // Actions
    createBucket: createBucket.createBucket,
    deleteBucket: deleteBucket.deleteBucket,
    uploadObject: uploadObject.uploadObject,
    downloadObject: downloadObject.downloadObject,
    deleteObject: deleteObject.deleteObject,

    // State
    isLoading,
    errors,
    hasErrors: errors.length > 0,
    uploadProgress: uploadObject.progress,

    // Refresh
    refreshAll,
    refreshBuckets: buckets.mutate,
    refreshObjects: objects.mutate,
  };
}
