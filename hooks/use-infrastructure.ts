/**
 * Comprehensive Infrastructure Hook
 * Main hook that combines all infrastructure services
 */

import { useCallback } from 'react';
import { useFirecracker } from './use-firecracker';
import { useDocker } from './use-docker';
import { useStorage } from './use-storage';
import { useInfrastructureHealth } from './use-metrics';

export interface UseInfrastructureOptions {
  // Firecracker options
  userId?: string;
  instanceId?: string;
  
  // Docker options
  containerId?: string;
  
  // Storage options
  bucketName?: string;
  prefix?: string;
  
  // General options
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useInfrastructure(options: UseInfrastructureOptions = {}) {
  const { 
    userId, 
    instanceId, 
    containerId, 
    bucketName, 
    prefix,
    refreshInterval = 30000 
  } = options;

  // Service hooks
  const firecracker = useFirecracker({ userId, instanceId });
  const docker = useDocker({ containerId });
  const storage = useStorage({ bucketName, prefix });
  const health = useInfrastructureHealth(refreshInterval);

  // Refresh all services
  const refreshAll = useCallback(async () => {
    await Promise.all([
      firecracker.refreshAll(),
      docker.refreshAll(),
      storage.refreshAll(),
      health.mutate(),
    ]);
  }, [firecracker.refreshAll, docker.refreshAll, storage.refreshAll, health.mutate]);

  // Check if any service is loading
  const isLoading = 
    firecracker.isLoading ||
    docker.isLoading ||
    storage.isLoading ||
    health.isLoading;

  // Collect all errors
  const errors = [
    ...firecracker.errors,
    ...docker.errors,
    ...storage.errors,
    health.isError,
  ].filter(Boolean);

  // Service status summary
  const serviceStatus = {
    firecracker: {
      healthy: !firecracker.hasErrors,
      instanceCount: firecracker.instances?.length || 0,
      runningInstances: firecracker.instances?.filter(i => i.status === 'running').length || 0,
    },
    docker: {
      healthy: !docker.hasErrors,
      containerCount: docker.containers?.length || 0,
      runningContainers: docker.containers?.filter(c => c.status === 'running').length || 0,
    },
    storage: {
      healthy: !storage.hasErrors,
      bucketCount: storage.buckets?.length || 0,
      totalObjects: storage.objects?.length || 0,
    },
    overall: {
      healthy: !errors.length && health.health?.status === 'healthy',
      status: health.health?.status || 'unknown',
    },
  };

  return {
    // Service data
    firecracker: {
      instances: firecracker.instances,
      instance: firecracker.instance,
      logs: firecracker.logs,
      templates: firecracker.templates,
      snapshots: firecracker.snapshots,
    },
    docker: {
      containers: docker.containers,
      container: docker.container,
      stats: docker.stats,
    },
    storage: {
      buckets: storage.buckets,
      objects: storage.objects,
    },
    health: health.health,

    // Service actions
    firecrackerActions: {
      createInstance: firecracker.createInstance,
      startInstance: firecracker.startInstance,
      stopInstance: firecracker.stopInstance,
      restartInstance: firecracker.restartInstance,
      deleteInstance: firecracker.deleteInstance,
      executeCommand: firecracker.executeCommand,
      createTemplate: firecracker.createTemplate,
      deleteTemplate: firecracker.deleteTemplate,
      createSnapshot: firecracker.createSnapshot,
      deleteSnapshot: firecracker.deleteSnapshot,
      restoreSnapshot: firecracker.restoreSnapshot,
    },
    dockerActions: {
      createContainer: docker.createContainer,
      startContainer: docker.startContainer,
      stopContainer: docker.stopContainer,
      deleteContainer: docker.deleteContainer,
    },
    storageActions: {
      createBucket: storage.createBucket,
      deleteBucket: storage.deleteBucket,
      uploadObject: storage.uploadObject,
      downloadObject: storage.downloadObject,
      deleteObject: storage.deleteObject,
    },

    // State
    isLoading,
    errors,
    hasErrors: errors.length > 0,
    serviceStatus,

    // Actions
    refreshAll,
    refreshFirecracker: firecracker.refreshAll,
    refreshDocker: docker.refreshAll,
    refreshStorage: storage.refreshAll,
    refreshHealth: health.mutate,
  };
}

// Export individual service hooks for granular usage
export { useFirecracker } from './use-firecracker';
export { useDocker } from './use-docker';
export { useStorage } from './use-storage';
export { useInfrastructureHealth } from './use-metrics';

// Export types
export type {
  UseFirecrackerOptions,
  CreateInstanceRequest,
  CommandResult,
  CreateTemplateRequest,
  CreateSnapshotRequest,
} from './use-firecracker';

export type {
  UseDockerOptions,
  CreateContainerRequest,
} from './use-docker';

export type {
  UseStorageOptions,
  CreateBucketRequest,
  UploadObjectRequest,
} from './use-storage';
