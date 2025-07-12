/**
 * Firecracker Templates Hook
 * Custom React hooks for managing WebVM templates
 */

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { WebVMTemplate } from '@/lib/infrastructure/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// =============================================================================
// DATA FETCHING HOOKS
// =============================================================================

export function useFirecrackerTemplates() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/infrastructure/firecracker/templates',
    fetcher
  );

  return {
    templates: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// =============================================================================
// TEMPLATE MANAGEMENT HOOKS
// =============================================================================

export interface CreateTemplateRequest {
  name: string;
  image: string;
  description?: string;
  memory?: string;
  cpuCount?: number;
  diskSize?: string;
  environment?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export function useCreateFirecrackerTemplate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTemplate = useCallback(async (data: CreateTemplateRequest): Promise<WebVMTemplate> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/infrastructure/firecracker/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create template');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createTemplate,
    isLoading,
    error,
  };
}

export function useDeleteFirecrackerTemplate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteTemplate = useCallback(async (templateId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/infrastructure/firecracker/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    deleteTemplate,
    isLoading,
    error,
  };
}
