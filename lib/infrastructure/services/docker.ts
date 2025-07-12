/**
 * Docker Container Service
 * Production-ready service for Docker container management
 */

import { BaseInfrastructureService } from './base';
import { config } from '@/lib/config/environment';
import {
  Container,
  ContainerPort,
  ContainerVolume,
  ContainerStats,
  RestartPolicy,
  ApiResponse,
} from '../types';

export class DockerService extends BaseInfrastructureService {
  private readonly networkName: string;

  constructor() {
    super('docker', config.docker.apiUrl || 'http://localhost:2376');

    this.networkName = config.docker.networkName;

    if (config.docker.apiUrl) {
      this.validateConfig(['DOCKER_API_URL']);
    }
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${config.security.infrastructureJwtSecret}`,
      'X-Admin-Key': config.security.adminApiKey,
    };
  }

  // =============================================================================
  // CONTAINER MANAGEMENT
  // =============================================================================

  async listContainers(all: boolean = false): Promise<ApiResponse<Container[]>> {
    try {
      const params = new URLSearchParams({ all: all.toString() });
      const response = await this.makeRequest<Container[]>(`/containers/json?${params}`);
      
      if (!response.success) {
        return response as ApiResponse<Container[]>;
      }

      const containers: Container[] = response.data?.map((dockerContainer: unknown) => this.mapDockerContainer(dockerContainer as Record<string, unknown>)) || [];
      this.log('info', `Listed ${containers.length} containers`);
      
      return this.formatSuccess(containers);
    } catch (error) {
      return this.formatError(error) as ApiResponse<Container[]>;
    }
  }

  async getContainer(containerId: string): Promise<ApiResponse<Container>> {
    try {
      this.validateParams({ containerId } as Record<string, unknown>, ['containerId']);

      const response = await this.makeRequest<Container>(`/containers/${containerId}/json`);
      
      if (!response.success) {
        return response as ApiResponse<Container>;
      }

      const container = this.mapDockerContainer(response.data as unknown as Record<string, unknown>);
      this.log('info', `Retrieved container: ${containerId}`);
      
      return this.formatSuccess(container);
    } catch (error) {
      return this.formatError(error) as ApiResponse<Container>;
    }
  }

  async createContainer(request: CreateContainerRequest): Promise<ApiResponse<Container>> {
    try {
      const validationParams = {
        name: request.name,
        image: request.image,
      };
      this.validateParams(validationParams, ['name', 'image']);

      const containerConfig = {
        Image: request.image,
        Cmd: request.command,
        Env: Object.entries(request.environment || {}).map(([key, value]) => `${key}=${value}`),
        ExposedPorts: this.formatExposedPorts(request.ports || []),
        HostConfig: {
          PortBindings: this.formatPortBindings(request.ports || []),
          Binds: this.formatBinds(request.volumes || []),
          RestartPolicy: { Name: request.restartPolicy || 'unless-stopped' },
          NetworkMode: request.networkMode || this.networkName,
        },
        Labels: {
          'vibekraft.managed': 'true',
          'vibekraft.created': new Date().toISOString(),
          ...request.labels,
        },
        NetworkingConfig: {
          EndpointsConfig: {
            [this.networkName]: {},
          },
        },
      };

      const createResponse = await this.makeRequest<{ Id: string }>('/containers/create', {
        method: 'POST',
        body: containerConfig,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!createResponse.success) {
        return {
          success: false,
          error: createResponse.error || 'Failed to create container',
          data: undefined,
        } as ApiResponse<Container>;
      }

      const containerId = createResponse.data!.Id;
      
      // Get the created container details
      const containerResponse = await this.getContainer(containerId);
      
      if (containerResponse.success) {
        this.log('info', `Created container: ${request.name} (${containerId})`);
      }

      return containerResponse;
    } catch (error) {
      return this.formatError(error) as ApiResponse<Container>;
    }
  }

  async startContainer(containerId: string): Promise<ApiResponse<void>> {
    try {
      this.validateParams({ containerId } as Record<string, unknown>, ['containerId']);

      const response = await this.makeRequest<void>(`/containers/${containerId}/start`, {
        method: 'POST',
      });

      if (response.success) {
        this.log('info', `Started container: ${containerId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<void>;
    }
  }

  async stopContainer(containerId: string, timeout: number = 10): Promise<ApiResponse<void>> {
    try {
      this.validateParams({ containerId } as Record<string, unknown>, ['containerId']);

      const params = new URLSearchParams({ t: timeout.toString() });
      const response = await this.makeRequest<void>(`/containers/${containerId}/stop?${params}`, {
        method: 'POST',
      });

      if (response.success) {
        this.log('info', `Stopped container: ${containerId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<void>;
    }
  }

  async restartContainer(containerId: string, timeout: number = 10): Promise<ApiResponse<void>> {
    try {
      this.validateParams({ containerId } as Record<string, unknown>, ['containerId']);

      const params = new URLSearchParams({ t: timeout.toString() });
      const response = await this.makeRequest<void>(`/containers/${containerId}/restart?${params}`, {
        method: 'POST',
      });

      if (response.success) {
        this.log('info', `Restarted container: ${containerId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<void>;
    }
  }

  async deleteContainer(containerId: string, force: boolean = false): Promise<ApiResponse<void>> {
    try {
      this.validateParams({ containerId } as Record<string, unknown>, ['containerId']);

      const params = new URLSearchParams({ force: force.toString() });
      const response = await this.makeRequest<void>(`/containers/${containerId}?${params}`, {
        method: 'DELETE',
      });

      if (response.success) {
        this.log('info', `Deleted container: ${containerId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<void>;
    }
  }

  // =============================================================================
  // CONTAINER STATS & MONITORING
  // =============================================================================

  async getContainerStats(containerId: string): Promise<ApiResponse<ContainerStats>> {
    try {
      this.validateParams({ containerId } as Record<string, unknown>, ['containerId']);

      const params = new URLSearchParams({ stream: 'false' });
      const response = await this.makeRequest<ContainerStats>(`/containers/${containerId}/stats?${params}`);

      if (!response.success) {
        return response as ApiResponse<ContainerStats>;
      }

      const stats = this.mapContainerStats(response.data as unknown as Record<string, unknown>);
      return this.formatSuccess(stats);
    } catch (error) {
      return this.formatError(error) as ApiResponse<ContainerStats>;
    }
  }

  async getContainerLogs(
    containerId: string,
    options: LogOptions = {}
  ): Promise<ApiResponse<string[]>> {
    try {
      this.validateParams({ containerId } as Record<string, unknown>, ['containerId']);

      const params = new URLSearchParams({
        stdout: 'true',
        stderr: 'true',
        tail: (options.tail || 100).toString(),
        timestamps: (options.timestamps || false).toString(),
      });

      if (options.since) {
        params.append('since', Math.floor(options.since.getTime() / 1000).toString());
      }

      const logResponse = await this.makeRequest<string[]>(`/containers/${containerId}/logs?${params}`);

      if (!logResponse.success) {
        return {
          success: false,
          error: logResponse.error || 'Failed to get container logs',
          data: undefined,
        } as ApiResponse<string[]>;
      }

      // Parse Docker logs format
      const logs = this.parseDockerLogs(logResponse.data as unknown as string);
      return this.formatSuccess(logs);
    } catch (error) {
      return this.formatError(error) as ApiResponse<string[]>;
    }
  }

  // =============================================================================
  // IMAGE MANAGEMENT
  // =============================================================================

  async listImages(): Promise<ApiResponse<DockerImage[]>> {
    try {
      const response = await this.makeRequest<DockerImage[]>('/images/json');
      
      if (!response.success) {
        return response as ApiResponse<DockerImage[]>;
      }

      const images: DockerImage[] = response.data?.map((dockerImage: unknown) => this.mapDockerImage(dockerImage as Record<string, unknown>)) || [];
      this.log('info', `Listed ${images.length} images`);
      
      return this.formatSuccess(images);
    } catch (error) {
      return this.formatError(error) as ApiResponse<DockerImage[]>;
    }
  }

  async pullImage(imageName: string, tag: string = 'latest'): Promise<ApiResponse<void>> {
    try {
      this.validateParams({ imageName }, ['imageName']);

      const params = new URLSearchParams({ fromImage: imageName, tag });
      const response = await this.makeRequest<void>(`/images/create?${params}`, {
        method: 'POST',
        timeout: 300000, // 5 minutes for image pull
      });

      if (response.success) {
        this.log('info', `Pulled image: ${imageName}:${tag}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<void>;
    }
  }

  async deleteImage(imageId: string, force: boolean = false): Promise<ApiResponse<void>> {
    try {
      this.validateParams({ imageId }, ['imageId']);

      const params = new URLSearchParams({ force: force.toString() });
      const response = await this.makeRequest<void>(`/images/${imageId}?${params}`, {
        method: 'DELETE',
      });

      if (response.success) {
        this.log('info', `Deleted image: ${imageId}`);
      }

      return response;
    } catch (error) {
      return this.formatError(error) as ApiResponse<void>;
    }
  }

  // =============================================================================
  // NETWORK MANAGEMENT
  // =============================================================================

  async listNetworks(): Promise<ApiResponse<DockerNetwork[]>> {
    try {
      const response = await this.makeRequest<DockerNetwork[]>('/networks');
      
      if (!response.success) {
        return response as ApiResponse<DockerNetwork[]>;
      }

      const networks: DockerNetwork[] = response.data?.map((dockerNetwork: unknown) => this.mapDockerNetwork(dockerNetwork as Record<string, unknown>)) || [];
      return this.formatSuccess(networks);
    } catch (error) {
      return this.formatError(error) as ApiResponse<DockerNetwork[]>;
    }
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private mapDockerContainer(dockerContainer: Record<string, unknown>): Container {
    return {
      id: dockerContainer.Id as string,
      name: ((dockerContainer.Names as string[])?.[0])?.replace('/', '') || (dockerContainer.Id as string).substring(0, 12),
      image: dockerContainer.Image as string,
      command: dockerContainer.Command ? (dockerContainer.Command as string).split(' ') : [],
      status: this.mapContainerStatus(dockerContainer.State as string || dockerContainer.Status as string),
      createdAt: new Date((dockerContainer.Created as number) * 1000),
      updatedAt: new Date(),
      ports: this.mapContainerPorts(dockerContainer.Ports as Array<Record<string, unknown>> || []),
      volumes: this.mapContainerVolumes(dockerContainer.Mounts as Array<Record<string, unknown>> || []),
      environment: {},
      restartPolicy: 'unless-stopped',
      networkMode: ((dockerContainer.HostConfig as Record<string, unknown>)?.NetworkMode as string) || this.networkName,
      labels: dockerContainer.Labels as Record<string, string> || {},
    };
  }

  private mapContainerStatus(state: string): Container['status'] {
    const statusMap: Record<string, Container['status']> = {
      'running': 'running',
      'exited': 'stopped',
      'created': 'creating',
      'restarting': 'running',
      'removing': 'deleting',
      'paused': 'stopped',
      'dead': 'error',
    };

    return statusMap[state.toLowerCase()] || 'unknown';
  }

  private mapContainerPorts(ports: Array<Record<string, unknown>>): ContainerPort[] {
    return ports.map(port => ({
      containerPort: port.PrivatePort as number,
      hostPort: port.PublicPort as number,
      protocol: port.Type as 'tcp' | 'udp',
    }));
  }

  private mapContainerVolumes(mounts: Array<Record<string, unknown>>): ContainerVolume[] {
    return mounts.map(mount => ({
      hostPath: mount.Source as string,
      containerPath: mount.Destination as string,
      readOnly: mount.RW === false,
    }));
  }

  private mapContainerStats(stats: Record<string, unknown>): ContainerStats {
    const cpuStats = stats.cpu_stats as Record<string, unknown>;
    const precpuStats = stats.precpu_stats as Record<string, unknown>;
    const memoryStats = stats.memory_stats as Record<string, unknown>;
    const networks = stats.networks as Record<string, Record<string, unknown>>;
    const blkioStats = stats.blkio_stats as Record<string, unknown>;

    const cpuUsage = cpuStats.cpu_usage as Record<string, unknown>;
    const precpuUsage = precpuStats.cpu_usage as Record<string, unknown>;

    const cpuDelta = (cpuUsage.total_usage as number) - (precpuUsage.total_usage as number);
    const systemDelta = (cpuStats.system_cpu_usage as number) - (precpuStats.system_cpu_usage as number);
    const cpuPercent = (cpuDelta / systemDelta) * (cpuStats.online_cpus as number) * 100;

    const eth0 = networks?.eth0 || {};
    const ioStats = blkioStats.io_service_bytes_recursive as Array<Record<string, unknown>> || [];

    return {
      cpuPercent: Math.round(cpuPercent * 100) / 100,
      memoryUsage: memoryStats.usage as number,
      memoryLimit: memoryStats.limit as number,
      networkRx: (eth0.rx_bytes as number) || 0,
      networkTx: (eth0.tx_bytes as number) || 0,
      blockRead: (ioStats[0]?.value as number) || 0,
      blockWrite: (ioStats[1]?.value as number) || 0,
    };
  }

  private mapDockerImage(dockerImage: Record<string, unknown>): DockerImage {
    return {
      id: dockerImage.Id as string,
      tags: dockerImage.RepoTags as string[] || [],
      size: dockerImage.Size as number,
      created: new Date((dockerImage.Created as number) * 1000),
    };
  }

  private mapDockerNetwork(dockerNetwork: Record<string, unknown>): DockerNetwork {
    return {
      id: dockerNetwork.Id as string,
      name: dockerNetwork.Name as string,
      driver: dockerNetwork.Driver as string,
      scope: dockerNetwork.Scope as string,
      created: new Date(dockerNetwork.Created as string),
    };
  }

  private formatExposedPorts(ports: ContainerPort[]): Record<string, object> {
    const exposedPorts: Record<string, object> = {};
    ports.forEach(port => {
      exposedPorts[`${port.containerPort}/${port.protocol}`] = {};
    });
    return exposedPorts;
  }

  private formatPortBindings(ports: ContainerPort[]): Record<string, Array<Record<string, string>>> {
    const portBindings: Record<string, Array<Record<string, string>>> = {};
    ports.forEach(port => {
      if (port.hostPort) {
        portBindings[`${port.containerPort}/${port.protocol}`] = [
          { HostPort: port.hostPort.toString() }
        ];
      }
    });
    return portBindings;
  }

  private formatBinds(volumes: ContainerVolume[]): string[] {
    return volumes.map(volume => 
      `${volume.hostPath}:${volume.containerPath}${volume.readOnly ? ':ro' : ''}`
    );
  }

  private parseDockerLogs(logData: string): string[] {
    // Docker logs format includes headers, strip them
    return logData.split('\n')
      .map(line => line.substring(8)) // Remove Docker log header
      .filter(line => line.trim().length > 0);
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface CreateContainerRequest {
  name: string;
  image: string;
  command?: string[];
  environment?: Record<string, string>;
  ports?: ContainerPort[];
  volumes?: ContainerVolume[];
  restartPolicy?: RestartPolicy;
  networkMode?: string;
  labels?: Record<string, string>;
}

export interface LogOptions {
  tail?: number;
  since?: Date;
  timestamps?: boolean;
}

export interface DockerImage {
  id: string;
  tags: string[];
  size: number;
  created: Date;
}

export interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  scope: string;
  created: Date;
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const dockerService = new DockerService();
