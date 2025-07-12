/**
 * Storage Operations Hook
 * Custom hook for MinIO storage operations with state management
 */

import { useState, useCallback } from 'react';
import { StorageObject, StorageUploadRequest, StorageDownloadRequest } from '@/lib/infrastructure/types';

interface UseStorageOperationsReturn {
  objects: StorageObject[];
  loading: boolean;
  error: string | null;
  uploadProgress: number;
  listObjects: (bucket: string, prefix?: string) => Promise<void>;
  uploadObject: (request: StorageUploadRequest) => Promise<void>;
  downloadObject: (request: StorageDownloadRequest) => Promise<void>;
  deleteObject: (bucket: string, key: string) => Promise<void>;
  createFolder: (bucket: string, folderPath: string) => Promise<void>;
}

export function useStorageOperations(): UseStorageOperationsReturn {
  const [objects, setObjects] = useState<StorageObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const listObjects = useCallback(async (bucket: string, prefix?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (prefix) params.append('prefix', prefix);

      const response = await fetch(`/api/infrastructure/storage/${bucket}/objects?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to list objects: ${response.statusText}`);
      }

      const data = await response.json();
      setObjects(data.objects || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list objects';
      setError(errorMessage);
      console.error('Error listing objects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadObject = useCallback(async (request: StorageUploadRequest) => {
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('key', request.key);
      formData.append('bucket', request.bucket);
      
      if (request.metadata) {
        formData.append('metadata', JSON.stringify(request.metadata));
      }

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle completion
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });
      });

      xhr.open('POST', '/api/infrastructure/storage/upload');
      xhr.send(formData);

      await uploadPromise;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload object';
      setError(errorMessage);
      setUploadProgress(0);
      throw err;
    }
  }, []);

  const downloadObject = useCallback(async (request: StorageDownloadRequest) => {
    setError(null);

    try {
      const params = new URLSearchParams({
        bucket: request.bucket,
        key: request.key,
      });

      const response = await fetch(`/api/infrastructure/storage/download?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download object: ${response.statusText}`);
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = request.key.split('/').pop() || request.key;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download object';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteObject = useCallback(async (bucket: string, key: string) => {
    setError(null);

    try {
      const response = await fetch('/api/infrastructure/storage/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bucket, key }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete object: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete object';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const createFolder = useCallback(async (bucket: string, folderPath: string) => {
    setError(null);

    try {
      const response = await fetch('/api/infrastructure/storage/folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bucket, folderPath }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create folder: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    objects,
    loading,
    error,
    uploadProgress,
    listObjects,
    uploadObject,
    downloadObject,
    deleteObject,
    createFolder,
  };
}
