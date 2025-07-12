/**
 * Prometheus Metrics Service
 * Production-ready service for Prometheus metrics and monitoring
 */

import { BaseInfrastructureService } from './base';
import { config } from '@/lib/config/environment';
import {
  MetricQuery,
  MetricResponse,
  Dashboard,
  DashboardPanel,
  TimeRange,
  ApiResponse,
} from '../types';

export class MetricsService extends BaseInfrastructureService {
  private readonly grafanaApiKey?: string;

  constructor() {
    super('metrics', config.monitoring.prometheusUrl || '');
    
    this.grafanaApiKey = config.monitoring.grafanaApiKey;

    if (config.features.metrics) {
      this.validateConfig(['PROMETHEUS_URL']);
    }
  }

  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.grafanaApiKey) {
      headers['Authorization'] = `Bearer ${this.grafanaApiKey}`;
    }

    return headers;
  }

  // =============================================================================
  // PROMETHEUS QUERY OPERATIONS
  // =============================================================================

  async query(query: string): Promise<ApiResponse<MetricResponse>> {
    try {
      this.validateParams({ query }, ['query']);

      const params = new URLSearchParams({ query });
      const response = await this.makeRequest<MetricResponse>(`/api/v1/query?${params}`);

      if (response.success) {
        this.log('info', `Executed query: ${query}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error);
    }
  }

  async queryRange(
    query: string,
    start: Date,
    end: Date,
    step: string = '15s'
  ): Promise<ApiResponse<MetricResponse>> {
    try {
      this.validateParams({ query, start, end }, ['query', 'start', 'end']);

      const params = new URLSearchParams({
        query,
        start: Math.floor(start.getTime() / 1000).toString(),
        end: Math.floor(end.getTime() / 1000).toString(),
        step,
      });

      const response = await this.makeRequest<MetricResponse>(`/api/v1/query_range?${params}`);

      if (response.success) {
        this.log('info', `Executed range query: ${query} (${start.toISOString()} - ${end.toISOString()})`);
      }

      return response;
    } catch (error) {
      return this.formatError(error);
    }
  }

  async getMetricNames(): Promise<ApiResponse<string[]>> {
    try {
      const response = await this.makeRequest<{ data: string[] }>('/api/v1/label/__name__/values');
      
      if (response.success && response.data) {
        return this.formatSuccess(response.data.data);
      }

      return response as ApiResponse<string[]>;
    } catch (error) {
      return this.formatError(error);
    }
  }

  async getLabelValues(label: string): Promise<ApiResponse<string[]>> {
    try {
      this.validateParams({ label }, ['label']);

      const response = await this.makeRequest<{ data: string[] }>(`/api/v1/label/${label}/values`);
      
      if (response.success && response.data) {
        return this.formatSuccess(response.data.data);
      }

      return response as ApiResponse<string[]>;
    } catch (error) {
      return this.formatError(error);
    }
  }

  // =============================================================================
  // INFRASTRUCTURE METRICS
  // =============================================================================

  async getSystemMetrics(timeRange: TimeRange): Promise<ApiResponse<SystemMetrics>> {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - this.parseTimeRange(timeRange.from));

      const queries = {
        cpu: 'avg(100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100))',
        memory: 'avg((1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100)',
        disk: 'avg((1 - (node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes{fstype!="tmpfs"})) * 100)',
        network: 'avg(irate(node_network_receive_bytes_total[5m]) + irate(node_network_transmit_bytes_total[5m]))',
      };

      const results = await Promise.all(
        Object.entries(queries).map(async ([key, query]) => {
          const response = await this.queryRange(query, start, end);
          return [key, response.data?.data.result || []];
        })
      );

      const metrics: SystemMetrics = Object.fromEntries(results) as SystemMetrics;
      return this.formatSuccess(metrics);
    } catch (error) {
      return this.formatError(error);
    }
  }

  async getContainerMetrics(containerId?: string): Promise<ApiResponse<ContainerMetrics[]>> {
    try {
      const containerFilter = containerId ? `{id="${containerId}"}` : '';
      
      const queries = {
        cpu: `rate(container_cpu_usage_seconds_total${containerFilter}[5m]) * 100`,
        memory: `container_memory_usage_bytes${containerFilter}`,
        network: `rate(container_network_receive_bytes_total${containerFilter}[5m]) + rate(container_network_transmit_bytes_total${containerFilter}[5m])`,
      };

      const end = new Date();
      const start = new Date(end.getTime() - 3600000); // Last hour

      const results = await Promise.all(
        Object.entries(queries).map(async ([key, query]) => {
          const response = await this.queryRange(query, start, end);
          return [key, response.data?.data.result || []];
        })
      );

      // Process and combine results into container metrics
      const containerMetrics: ContainerMetrics[] = this.processContainerMetrics(results);
      return this.formatSuccess(containerMetrics);
    } catch (error) {
      return this.formatError(error);
    }
  }

  async getWebVMMetrics(instanceId?: string): Promise<ApiResponse<WebVMMetrics[]>> {
    try {
      const instanceFilter = instanceId ? `{instance_id="${instanceId}"}` : '';
      
      const queries = {
        cpu: `webvm_cpu_usage_percent${instanceFilter}`,
        memory: `webvm_memory_usage_bytes${instanceFilter}`,
        disk: `webvm_disk_usage_bytes${instanceFilter}`,
        network: `rate(webvm_network_bytes_total${instanceFilter}[5m])`,
      };

      const end = new Date();
      const start = new Date(end.getTime() - 3600000); // Last hour

      const results = await Promise.all(
        Object.entries(queries).map(async ([key, query]) => {
          const response = await this.queryRange(query, start, end);
          return [key, response.data?.data.result || []];
        })
      );

      const webvmMetrics: WebVMMetrics[] = this.processWebVMMetrics(results);
      return this.formatSuccess(webvmMetrics);
    } catch (error) {
      return this.formatError(error);
    }
  }

  // =============================================================================
  // DASHBOARD OPERATIONS
  // =============================================================================

  async createDashboard(dashboard: Omit<Dashboard, 'id'>): Promise<ApiResponse<Dashboard>> {
    try {
      if (!config.monitoring.grafanaUrl) {
        throw new Error('Grafana URL not configured');
      }

      const dashboardData = {
        dashboard: {
          title: dashboard.title,
          panels: dashboard.panels,
          time: dashboard.timeRange,
          refresh: dashboard.refreshInterval,
        },
        overwrite: false,
      };

      const response = await fetch(`${config.monitoring.grafanaUrl}/api/dashboards/db`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dashboardData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create dashboard: ${response.statusText}`);
      }

      const result = await response.json();
      const createdDashboard: Dashboard = {
        id: result.id,
        ...dashboard,
      };

      this.log('info', `Created dashboard: ${dashboard.title}`);
      return this.formatSuccess(createdDashboard);
    } catch (error) {
      return this.formatError(error);
    }
  }

  async getDashboard(id: string): Promise<ApiResponse<Dashboard>> {
    try {
      if (!config.monitoring.grafanaUrl) {
        throw new Error('Grafana URL not configured');
      }

      const response = await fetch(`${config.monitoring.grafanaUrl}/api/dashboards/uid/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get dashboard: ${response.statusText}`);
      }

      const result = await response.json();
      return this.formatSuccess(result.dashboard);
    } catch (error) {
      return this.formatError(error);
    }
  }

  // =============================================================================
  // ALERTING
  // =============================================================================

  async createAlert(alert: AlertRule): Promise<ApiResponse<AlertRule>> {
    try {
      // Implementation for creating Prometheus alerting rules
      const response = await this.makeRequest('/api/v1/rules', {
        method: 'POST',
        body: alert,
      });

      if (response.success) {
        this.log('info', `Created alert rule: ${alert.name}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error);
    }
  }

  async getAlerts(): Promise<ApiResponse<Alert[]>> {
    try {
      const response = await this.makeRequest<{ data: { alerts: Alert[] } }>('/api/v1/alerts');
      
      if (response.success && response.data) {
        return this.formatSuccess(response.data.data.alerts);
      }

      return response as ApiResponse<Alert[]>;
    } catch (error) {
      return this.formatError(error);
    }
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private parseTimeRange(timeRange: string): number {
    const match = timeRange.match(/(\d+)([smhd])/);
    if (!match) return 3600000; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    };

    return value * (multipliers[unit as keyof typeof multipliers] || 3600000);
  }

  private processContainerMetrics(results: [string, any[]][]): ContainerMetrics[] {
    // Process Prometheus results into structured container metrics
    const metricsMap = new Map<string, Partial<ContainerMetrics>>();

    results.forEach(([metricType, data]) => {
      data.forEach((series: any) => {
        const containerId = series.metric.id || series.metric.container_id;
        if (!containerId) return;

        if (!metricsMap.has(containerId)) {
          metricsMap.set(containerId, { id: containerId });
        }

        const metric = metricsMap.get(containerId)!;
        metric[metricType as keyof ContainerMetrics] = series.values;
      });
    });

    return Array.from(metricsMap.values()) as ContainerMetrics[];
  }

  private processWebVMMetrics(results: [string, any[]][]): WebVMMetrics[] {
    // Process Prometheus results into structured WebVM metrics
    const metricsMap = new Map<string, Partial<WebVMMetrics>>();

    results.forEach(([metricType, data]) => {
      data.forEach((series: any) => {
        const instanceId = series.metric.instance_id;
        if (!instanceId) return;

        if (!metricsMap.has(instanceId)) {
          metricsMap.set(instanceId, { instanceId });
        }

        const metric = metricsMap.get(instanceId)!;
        metric[metricType as keyof WebVMMetrics] = series.values;
      });
    });

    return Array.from(metricsMap.values()) as WebVMMetrics[];
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface SystemMetrics {
  cpu: any[];
  memory: any[];
  disk: any[];
  network: any[];
}

interface ContainerMetrics {
  id: string;
  cpu?: any[];
  memory?: any[];
  network?: any[];
}

interface WebVMMetrics {
  instanceId: string;
  cpu?: any[];
  memory?: any[];
  disk?: any[];
  network?: any[];
}

interface AlertRule {
  name: string;
  query: string;
  condition: string;
  threshold: number;
  duration: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
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

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const metricsService = new MetricsService();
