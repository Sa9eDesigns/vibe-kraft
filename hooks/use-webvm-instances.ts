import useSWR from 'swr';
import { useState } from 'react';
import { 
  CreateWebVMInstanceInput, 
  UpdateWebVMInstanceInput, 
  WebVMInstanceQueryInput,
  BulkUpdateWebVMInstancesInput,
  CreateWebVMMetricInput 
} from '@/lib/validations/workspace';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWebVMInstances(organizationId?: string, query?: WebVMInstanceQueryInput) {
  const queryParams = new URLSearchParams();
  if (organizationId) queryParams.append('organizationId', organizationId);
  if (query?.workspaceId) queryParams.append('workspaceId', query.workspaceId);
  if (query?.status) queryParams.append('status', query.status);
  if (query?.search) queryParams.append('search', query.search);
  if (query?.page) queryParams.append('page', query.page.toString());
  if (query?.limit) queryParams.append('limit', query.limit.toString());
  if (query?.sortBy) queryParams.append('sortBy', query.sortBy);
  if (query?.sortOrder) queryParams.append('sortOrder', query.sortOrder);

  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/webvm-instances?${queryParams.toString()}` : null,
    fetcher
  );

  return {
    instances: data?.instances || data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,
    totalPages: data?.totalPages || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useWebVMInstancesByWorkspace(workspaceId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    workspaceId ? `/api/webvm-instances?workspaceId=${workspaceId}` : null,
    fetcher
  );

  return {
    instances: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useWebVMInstance(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/webvm-instances/${id}` : null,
    fetcher
  );

  return {
    instance: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCreateWebVMInstance() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInstance = async (data: CreateWebVMInstanceInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/webvm-instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create WebVM instance');
      }

      const instance = await response.json();
      return instance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create WebVM instance';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createInstance,
    isLoading,
    error,
  };
}

export function useUpdateWebVMInstance() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateInstance = async (id: string, data: UpdateWebVMInstanceInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/webvm-instances/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update WebVM instance');
      }

      const instance = await response.json();
      return instance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update WebVM instance';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateInstance,
    isLoading,
    error,
  };
}

export function useDeleteWebVMInstance() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteInstance = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/webvm-instances/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete WebVM instance');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete WebVM instance';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteInstance,
    isLoading,
    error,
  };
}

export function useControlWebVMInstance() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controlInstance = async (id: string, action: 'start' | 'stop' | 'restart') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/webvm-instances/${id}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} WebVM instance`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} WebVM instance`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    controlInstance,
    isLoading,
    error,
  };
}

export function useWebVMMetrics(instanceId?: string, metricType?: string, limit = 100) {
  const queryParams = new URLSearchParams();
  if (metricType) queryParams.append('metricType', metricType);
  if (limit) queryParams.append('limit', limit.toString());

  const { data, error, isLoading, mutate } = useSWR(
    instanceId ? `/api/webvm-instances/${instanceId}/metrics?${queryParams.toString()}` : null,
    fetcher
  );

  return {
    metrics: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCreateWebVMMetric() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMetric = async (instanceId: string, data: Omit<CreateWebVMMetricInput, 'instanceId'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/webvm-instances/${instanceId}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create metric');
      }

      const metric = await response.json();
      return metric;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create metric';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createMetric,
    isLoading,
    error,
  };
}

export function useWebVMInstanceStats(organizationId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/dashboard/stats?organizationId=${organizationId}` : null,
    fetcher
  );

  return {
    stats: data?.instances,
    isLoading,
    isError: error,
    mutate,
  };
}
