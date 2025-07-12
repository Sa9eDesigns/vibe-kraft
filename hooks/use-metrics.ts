/**
 * Metrics Hook
 * Custom hook for Prometheus metrics with real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface SystemMetrics {
  cpu: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    used: number;
    available: number;
    cached: number;
    buffers: number;
  };
  memory: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    used: number;
    available: number;
    cached: number;
    buffers: number;
  };
  disk: {
    current: number;
    trend: 'up' | 'down' | 'stable';
  };
  network: {
    current: number;
    trend: 'up' | 'down' | 'stable';
  };
  timeSeries: Array<{
    timestamp: string;
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  }>;
  cpuCores?: Array<{
    name: string;
    usage: number;
  }>;
  disks?: Array<{
    device: string;
    usage: number;
    total: number;
    used: number;
  }>;
}

interface ContainerMetrics {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  memoryUsage: number;
  memoryLimit: number;
  networkRx: number;
  networkTx: number;
}

interface WebVMMetrics {
  instanceId: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: string;
}

interface Alert {
  id: string;
  name: string;
  state: 'firing' | 'pending' | 'inactive';
  value: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  activeAt: Date;
}

interface UseMetricsReturn {
  systemMetrics: SystemMetrics;
  containerMetrics: ContainerMetrics[];
  webvmMetrics: WebVMMetrics[];
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  refreshMetrics: () => void;
}

export function useMetrics(
  timeRange: string = '1h',
  refreshInterval: number = 30
): UseMetricsReturn {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: { current: 0, trend: 'stable', used: 0, available: 0, cached: 0, buffers: 0 },
    memory: { current: 0, trend: 'stable', used: 0, available: 0, cached: 0, buffers: 0 },
    disk: { current: 0, trend: 'stable' },
    network: { current: 0, trend: 'stable' },
    timeSeries: [],
  });
  const [containerMetrics, setContainerMetrics] = useState<ContainerMetrics[]>([]);
  const [webvmMetrics, setWebvmMetrics] = useState<WebVMMetrics[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSystemMetrics = useCallback(async () => {
    try {
      const response = await fetch(`/api/infrastructure/metrics/system?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch system metrics: ${response.statusText}`);
      }
      const data = await response.json();
      setSystemMetrics(data.metrics);
    } catch (err) {
      console.error('Error fetching system metrics:', err);
      throw err;
    }
  }, [timeRange]);

  const fetchContainerMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/infrastructure/metrics/containers');
      if (!response.ok) {
        throw new Error(`Failed to fetch container metrics: ${response.statusText}`);
      }
      const data = await response.json();
      setContainerMetrics(data.metrics);
    } catch (err) {
      console.error('Error fetching container metrics:', err);
      throw err;
    }
  }, []);

  const fetchWebVMMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/infrastructure/metrics/webvm');
      if (!response.ok) {
        throw new Error(`Failed to fetch WebVM metrics: ${response.statusText}`);
      }
      const data = await response.json();
      setWebvmMetrics(data.metrics);
    } catch (err) {
      console.error('Error fetching WebVM metrics:', err);
      throw err;
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/infrastructure/metrics/alerts');
      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }
      const data = await response.json();
      setAlerts(data.alerts);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      throw err;
    }
  }, []);

  const refreshMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchSystemMetrics(),
        fetchContainerMetrics(),
        fetchWebVMMetrics(),
        fetchAlerts(),
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchSystemMetrics, fetchContainerMetrics, fetchWebVMMetrics, fetchAlerts]);

  // Initial load
  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  // Set up auto-refresh
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refreshMetrics();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, refreshMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    systemMetrics,
    containerMetrics,
    webvmMetrics,
    alerts,
    loading,
    error,
    refreshMetrics,
  };
}

// Helper hook for custom Prometheus queries
export function usePrometheusQuery(query: string, timeRange?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ query });
      if (timeRange) {
        params.append('timeRange', timeRange);
      }

      const response = await fetch(`/api/infrastructure/metrics/query?${params}`);
      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Query execution failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [query, timeRange]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  return {
    data,
    loading,
    error,
    refetch: executeQuery,
  };
}

// Helper hook for real-time metrics streaming
export function useMetricsStream(endpoint: string, interval: number = 5000) {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        // Try WebSocket first, fallback to polling
        if ('EventSource' in window) {
          eventSource = new EventSource(`/api/infrastructure/metrics/stream?endpoint=${endpoint}`);
          
          eventSource.onopen = () => {
            setConnected(true);
            setError(null);
          };

          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              setData(data);
            } catch (err) {
              console.error('Failed to parse metrics data:', err);
            }
          };

          eventSource.onerror = () => {
            setConnected(false);
            setError('Connection lost');
            
            // Fallback to polling
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
            startPolling();
          };
        } else {
          startPolling();
        }
      } catch (err) {
        console.error('Failed to connect to metrics stream:', err);
        startPolling();
      }
    };

    const startPolling = () => {
      const poll = async () => {
        try {
          const response = await fetch(`/api/infrastructure/metrics/${endpoint}`);
          if (response.ok) {
            const data = await response.json();
            setData(data);
            setConnected(true);
            setError(null);
          } else {
            throw new Error(`Polling failed: ${response.statusText}`);
          }
        } catch (err) {
          setConnected(false);
          setError(err instanceof Error ? err.message : 'Polling failed');
        }
      };

      poll(); // Initial poll
      intervalId = setInterval(poll, interval);
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [endpoint, interval]);

  return {
    data,
    connected,
    error,
  };
}
