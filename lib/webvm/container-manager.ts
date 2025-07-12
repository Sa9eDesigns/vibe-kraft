/**
 * VibeKraft Container Manager (ConMan)
 * Similar to Replit's container management system
 */

import { EventEmitter } from 'events';
import { WebVMInstance, WebVMStatus } from '@prisma/client';
import { DevSandbox, DevSandboxConfig } from '@/components/webvm/core/dev-sandbox';
import { db } from '@/lib/db';

export interface ContainerInfo {
  id: string;
  instanceId: string;
  workspaceId: string;
  userId: string;
  sandbox: DevSandbox;
  status: WebVMStatus;
  connectionUrl: string;
  lastActivity: Date;
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export interface ContainerManagerConfig {
  maxContainers: number;
  idleTimeout: number; // milliseconds
  healthCheckInterval: number;
  resourceLimits: {
    maxCpu: number;
    maxMemory: number;
    maxDisk: number;
  };
}

export class ContainerManager extends EventEmitter {
  private containers = new Map<string, ContainerInfo>();
  private instanceToContainer = new Map<string, string>();
  private config: ContainerManagerConfig;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(config: ContainerManagerConfig) {
    super();
    this.config = config;
    this.startHealthCheck();
  }

  /**
   * Get or create a container for a WebVM instance
   */
  async getContainer(instanceId: string, userId: string): Promise<ContainerInfo> {
    // Check if container already exists
    const existingContainerId = this.instanceToContainer.get(instanceId);
    if (existingContainerId) {
      const container = this.containers.get(existingContainerId);
      if (container && container.status === 'RUNNING') {
        container.lastActivity = new Date();
        return container;
      }
    }

    // Get instance from database
    const instance = await db.webVMInstance.findUnique({
      where: { id: instanceId },
      include: {
        workspace: {
          include: {
            project: true
          }
        }
      }
    });

    if (!instance) {
      throw new Error(`WebVM instance ${instanceId} not found`);
    }

    // Create new container
    return this.createContainer(instance, userId);
  }

  /**
   * Create a new container for an instance
   */
  private async createContainer(instance: WebVMInstance & any, userId: string): Promise<ContainerInfo> {
    const containerId = `container_${instance.id}_${Date.now()}`;

    // Check container limits
    if (this.containers.size >= this.config.maxContainers) {
      await this.cleanupIdleContainers();
      
      if (this.containers.size >= this.config.maxContainers) {
        throw new Error('Maximum container limit reached');
      }
    }

    // Create DevSandbox configuration
    const sandboxConfig: DevSandboxConfig = {
      diskImage: instance.imageUrl || 'wss://disks.webvm.io/debian_large_20230522_5044875331.ext2',
      mounts: [
        { type: 'ext2', path: '/', dev: 'overlay' },
        { type: 'dir', path: '/workspace', dev: 'workspace' },
        { type: 'dir', path: '/data', dev: 'data' }
      ],
      aiProvider: 'openai',
      aiConfig: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4',
        tools: [],
        capabilities: {
          terminalControl: true,
          visualInterface: true,
          codeGeneration: true,
          debugging: true,
          fileSystemAccess: true
        },
        safety: {
          confirmActions: true,
          restrictedCommands: ['rm -rf /', 'dd', 'mkfs'],
          maxExecutionTime: 30000
        }
      },
      editor: 'monaco',
      theme: 'auto',
      layout: {
        defaultLayout: 'horizontal',
        panels: [
          { type: 'fileExplorer', size: 20 },
          { type: 'editor', size: 50 },
          { type: 'terminal', size: 30 }
        ],
        resizable: true,
        collapsible: true
      },
      crossOriginIsolation: true
    };

    // Create sandbox instance
    const sandbox = new DevSandbox(sandboxConfig);
    
    // Initialize sandbox
    await sandbox.initialize();

    // Create container info
    const containerInfo: ContainerInfo = {
      id: containerId,
      instanceId: instance.id,
      workspaceId: instance.workspaceId,
      userId,
      sandbox,
      status: 'RUNNING',
      connectionUrl: `wss://webvm.vibecraft.com/${containerId}`,
      lastActivity: new Date(),
      resources: {
        cpu: instance.resources?.cpu || 2,
        memory: instance.resources?.memory || 2048,
        disk: instance.resources?.disk || 10240
      }
    };

    // Store container
    this.containers.set(containerId, containerInfo);
    this.instanceToContainer.set(instance.id, containerId);

    // Update instance status in database
    await db.webVMInstance.update({
      where: { id: instance.id },
      data: {
        status: 'RUNNING',
        connectionUrl: containerInfo.connectionUrl,
        startedAt: new Date()
      }
    });

    this.emit('containerCreated', containerInfo);
    return containerInfo;
  }

  /**
   * Stop and remove a container
   */
  async stopContainer(containerId: string): Promise<void> {
    const container = this.containers.get(containerId);
    if (!container) {
      return;
    }

    try {
      // Cleanup sandbox
      await container.sandbox.cleanup();
      
      // Update database
      await db.webVMInstance.update({
        where: { id: container.instanceId },
        data: {
          status: 'STOPPED',
          connectionUrl: null,
          stoppedAt: new Date()
        }
      });

      // Remove from maps
      this.containers.delete(containerId);
      this.instanceToContainer.delete(container.instanceId);

      this.emit('containerStopped', container);
    } catch (error) {
      console.error(`Error stopping container ${containerId}:`, error);
      this.emit('containerError', { containerId, error });
    }
  }

  /**
   * Get container by ID
   */
  getContainerById(containerId: string): ContainerInfo | undefined {
    return this.containers.get(containerId);
  }

  /**
   * Get container by instance ID
   */
  getContainerByInstanceId(instanceId: string): ContainerInfo | undefined {
    const containerId = this.instanceToContainer.get(instanceId);
    return containerId ? this.containers.get(containerId) : undefined;
  }

  /**
   * List all containers
   */
  listContainers(): ContainerInfo[] {
    return Array.from(this.containers.values());
  }

  /**
   * Cleanup idle containers
   */
  private async cleanupIdleContainers(): Promise<void> {
    const now = new Date();
    const idleContainers: string[] = [];

    for (const [containerId, container] of this.containers) {
      const idleTime = now.getTime() - container.lastActivity.getTime();
      if (idleTime > this.config.idleTimeout) {
        idleContainers.push(containerId);
      }
    }

    // Stop idle containers
    for (const containerId of idleContainers) {
      await this.stopContainer(containerId);
    }
  }

  /**
   * Health check for all containers
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      for (const [containerId, container] of this.containers) {
        try {
          // Check if sandbox is still responsive
          const isHealthy = await this.checkContainerHealth(container);
          if (!isHealthy) {
            console.warn(`Container ${containerId} failed health check`);
            await this.stopContainer(containerId);
          }
        } catch (error) {
          console.error(`Health check failed for container ${containerId}:`, error);
          await this.stopContainer(containerId);
        }
      }

      // Cleanup idle containers
      await this.cleanupIdleContainers();
    }, this.config.healthCheckInterval);
  }

  /**
   * Check if a container is healthy
   */
  private async checkContainerHealth(container: ContainerInfo): Promise<boolean> {
    try {
      // Simple health check - try to execute a basic command
      const result = await container.sandbox.executeCommand('echo "health_check"');
      return result.success && result.output.includes('health_check');
    } catch {
      return false;
    }
  }

  /**
   * Shutdown the container manager
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Stop all containers
    const containerIds = Array.from(this.containers.keys());
    await Promise.all(containerIds.map(id => this.stopContainer(id)));
  }
}

// Global container manager instance
let containerManager: ContainerManager | null = null;

export function getContainerManager(): ContainerManager {
  if (!containerManager) {
    containerManager = new ContainerManager({
      maxContainers: parseInt(process.env.MAX_CONTAINERS || '100'),
      idleTimeout: parseInt(process.env.IDLE_TIMEOUT || '1800000'), // 30 minutes
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000'), // 1 minute
      resourceLimits: {
        maxCpu: parseInt(process.env.MAX_CPU || '8'),
        maxMemory: parseInt(process.env.MAX_MEMORY || '8192'),
        maxDisk: parseInt(process.env.MAX_DISK || '51200')
      }
    });
  }
  return containerManager;
}
