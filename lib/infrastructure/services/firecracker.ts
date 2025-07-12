/**
 * Firecracker WebVM Service
 * Production-ready service for Firecracker microVM management
 */

import { BaseInfrastructureService } from './base';
import { config } from '@/lib/config/environment';
import {
  WebVMInstance,
  WebVMTemplate,
  WebVMSnapshot,
  NetworkConfig,
  ApiResponse,
} from '../types';

export class FirecrackerService extends BaseInfrastructureService {
  private readonly defaultImage: string;
  private readonly maxInstancesPerUser: number;
  private readonly defaultMemory: string;
  private readonly defaultCpuCount: number;

  constructor() {
    super('firecracker', config.webvm.firecrackerApiUrl || '');
    
    this.defaultImage = config.webvm.defaultImage;
    this.maxInstancesPerUser = config.webvm.maxInstancesPerUser;
    this.defaultMemory = config.webvm.defaultMemory;
    this.defaultCpuCount = config.webvm.defaultCpuCount;

    if (config.features.firecracker) {
      this.validateConfig(['FIRECRACKER_API_URL']);
    }
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${config.security.infrastructureJwtSecret}`,
      'X-Admin-Key': config.security.adminApiKey,
    };
  }

  // =============================================================================
  // INSTANCE MANAGEMENT
  // =============================================================================

  async listInstances(userId?: string): Promise<ApiResponse<WebVMInstance[]>> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const response = await this.makeRequest<WebVMInstance[]>(`/instances?${params}`);

      if (response.success) {
        this.log('info', `Listed instances for user: ${userId || 'all'}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<WebVMInstance[]>;
    }
  }

  async getInstance(instanceId: string): Promise<ApiResponse<WebVMInstance>> {
    try {
      this.validateParams({ instanceId } as Record<string, unknown>, ['instanceId']);

      const response = await this.makeRequest<WebVMInstance>(`/instances/${instanceId}`);

      if (response.success) {
        this.log('info', `Retrieved instance: ${instanceId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<WebVMInstance>;
    }
  }

  async createInstance(request: CreateInstanceRequest): Promise<ApiResponse<WebVMInstance>> {
    try {
      this.validateParams(request as unknown as Record<string, unknown>, ['userId', 'workspaceId']);

      // Check user instance limit
      const userInstances = await this.listInstances(request.userId);
      if (userInstances.success && userInstances.data) {
        const activeInstances = userInstances.data.filter(i => i.status === 'running').length;
        if (activeInstances >= this.maxInstancesPerUser) {
          throw new Error(`User has reached maximum instance limit: ${this.maxInstancesPerUser}`);
        }
      }

      const instanceConfig = {
        userId: request.userId,
        workspaceId: request.workspaceId,
        image: request.image || this.defaultImage,
        memory: request.memory || this.defaultMemory,
        cpuCount: request.cpuCount || this.defaultCpuCount,
        diskSize: request.diskSize || '10GB',
        networkConfig: request.networkConfig || await this.generateNetworkConfig(),
        vnc: request.vnc || false,
        environment: request.environment || {},
        metadata: request.metadata || {},
      };

      const response = await this.makeRequest<WebVMInstance>('/instances', {
        method: 'POST',
        body: instanceConfig,
      });

      if (response.success) {
        this.log('info', `Created instance for user ${request.userId}: ${response.data?.id}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<WebVMInstance>;
    }
  }

  async startInstance(instanceId: string): Promise<ApiResponse<WebVMInstance>> {
    try {
      this.validateParams({ instanceId } as Record<string, unknown>, ['instanceId']);

      const response = await this.makeRequest<WebVMInstance>(`/instances/${instanceId}/start`, {
        method: 'POST',
      });

      if (response.success) {
        this.log('info', `Started instance: ${instanceId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<WebVMInstance>;
    }
  }

  async stopInstance(instanceId: string): Promise<ApiResponse<WebVMInstance>> {
    try {
      this.validateParams({ instanceId } as Record<string, unknown>, ['instanceId']);

      const response = await this.makeRequest<WebVMInstance>(`/instances/${instanceId}/stop`, {
        method: 'POST',
      });

      if (response.success) {
        this.log('info', `Stopped instance: ${instanceId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<WebVMInstance>;
    }
  }

  async restartInstance(instanceId: string): Promise<ApiResponse<WebVMInstance>> {
    try {
      this.validateParams({ instanceId } as Record<string, unknown>, ['instanceId']);

      const response = await this.makeRequest<WebVMInstance>(`/instances/${instanceId}/restart`, {
        method: 'POST',
      });

      if (response.success) {
        this.log('info', `Restarted instance: ${instanceId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<WebVMInstance>;
    }
  }

  async deleteInstance(instanceId: string): Promise<ApiResponse<void>> {
    try {
      this.validateParams({ instanceId } as Record<string, unknown>, ['instanceId']);

      const response = await this.makeRequest<void>(`/instances/${instanceId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        this.log('info', `Deleted instance: ${instanceId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<void>;
    }
  }

  // =============================================================================
  // TEMPLATE MANAGEMENT
  // =============================================================================

  async listTemplates(): Promise<ApiResponse<WebVMTemplate[]>> {
    try {
      const response = await this.makeRequest<WebVMTemplate[]>('/templates');

      if (response.success) {
        this.log('info', 'Listed WebVM templates');
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<WebVMTemplate[]>;
    }
  }

  async createTemplate(template: Omit<WebVMTemplate, 'id'>): Promise<ApiResponse<WebVMTemplate>> {
    try {
      this.validateParams(template as unknown as Record<string, unknown>, ['name', 'image']);

      const response = await this.makeRequest<WebVMTemplate>('/templates', {
        method: 'POST',
        body: template,
      });

      if (response.success) {
        this.log('info', `Created template: ${template.name}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<WebVMTemplate>;
    }
  }

  async deleteTemplate(templateId: string): Promise<ApiResponse<void>> {
    try {
      this.validateParams({ templateId } as Record<string, unknown>, ['templateId']);

      const response = await this.makeRequest<void>(`/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        this.log('info', `Deleted template: ${templateId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<void>;
    }
  }

  // =============================================================================
  // SNAPSHOT MANAGEMENT
  // =============================================================================

  async createSnapshot(
    instanceId: string,
    name: string,
    description?: string
  ): Promise<ApiResponse<WebVMSnapshot>> {
    try {
      this.validateParams({ instanceId, name } as Record<string, unknown>, ['instanceId', 'name']);

      const snapshotData = {
        instanceId,
        name,
        description,
      };

      const response = await this.makeRequest<WebVMSnapshot>('/snapshots', {
        method: 'POST',
        body: snapshotData,
      });

      if (response.success) {
        this.log('info', `Created snapshot: ${name} for instance ${instanceId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<WebVMSnapshot>;
    }
  }

  async listSnapshots(instanceId?: string): Promise<ApiResponse<WebVMSnapshot[]>> {
    try {
      const params = new URLSearchParams();
      if (instanceId) params.append('instanceId', instanceId);

      const response = await this.makeRequest<WebVMSnapshot[]>(`/snapshots?${params}`);

      if (response.success) {
        this.log('info', `Listed snapshots for instance: ${instanceId || 'all'}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<WebVMSnapshot[]>;
    }
  }

  async restoreSnapshot(snapshotId: string): Promise<ApiResponse<WebVMInstance>> {
    try {
      this.validateParams({ snapshotId } as Record<string, unknown>, ['snapshotId']);

      const response = await this.makeRequest<WebVMInstance>(`/snapshots/${snapshotId}/restore`, {
        method: 'POST',
      });

      if (response.success) {
        this.log('info', `Restored snapshot: ${snapshotId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<WebVMInstance>;
    }
  }

  async deleteSnapshot(snapshotId: string): Promise<ApiResponse<void>> {
    try {
      this.validateParams({ snapshotId } as Record<string, unknown>, ['snapshotId']);

      const response = await this.makeRequest<void>(`/snapshots/${snapshotId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        this.log('info', `Deleted snapshot: ${snapshotId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<void>;
    }
  }

  // =============================================================================
  // NETWORKING
  // =============================================================================

  async getInstanceLogs(instanceId: string, lines: number = 100): Promise<ApiResponse<string[]>> {
    try {
      this.validateParams({ instanceId } as Record<string, unknown>, ['instanceId']);

      const params = new URLSearchParams({ lines: lines.toString() });
      const response = await this.makeRequest<{ logs: string[] }>(`/instances/${instanceId}/logs?${params}`);

      if (response.success && response.data) {
        return this.formatSuccess(response.data.logs);
      }

      return this.formatError(new Error('Failed to retrieve logs')) as ApiResponse<string[]>;
    } catch (error) {
      return this.formatError(error) as ApiResponse<string[]>;
    }
  }

  async executeCommand(
    instanceId: string,
    command: string,
    timeout: number = 30000
  ): Promise<ApiResponse<CommandResult>> {
    try {
      this.validateParams({ instanceId, command } as Record<string, unknown>, ['instanceId', 'command']);

      const commandData = {
        command,
        timeout,
      };

      const response = await this.makeRequest<CommandResult>(`/instances/${instanceId}/exec`, {
        method: 'POST',
        body: commandData,
        timeout,
      });

      if (response.success) {
        this.log('info', `Executed command on instance ${instanceId}: ${command}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<CommandResult>;
    }
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async generateNetworkConfig(): Promise<NetworkConfig> {
    // Generate unique network configuration for the instance
    const subnet = '10.0.0.0/24';
    const gateway = '10.0.0.1';
    const ipAddress = `10.0.0.${Math.floor(Math.random() * 254) + 2}`;
    
    return {
      ipAddress,
      subnet,
      gateway,
      dns: ['8.8.8.8', '8.8.4.4'],
    };
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface CreateInstanceRequest {
  userId: string;
  workspaceId: string;
  image?: string;
  memory?: string;
  cpuCount?: number;
  diskSize?: string;
  networkConfig?: NetworkConfig;
  vnc?: boolean;
  environment?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const firecrackerService = new FirecrackerService();
