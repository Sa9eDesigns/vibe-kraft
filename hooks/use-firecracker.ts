/**
 * Comprehensive Firecracker Hook
 * Main hook that combines all Firecracker operations
 */

import { useCallback } from 'react';
import {
  useFirecrackerInstances,
  useFirecrackerInstance,
  useFirecrackerInstanceLogs,
  useCreateFirecrackerInstance,
  useFirecrackerInstanceControl,
  useDeleteFirecrackerInstance,
  useFirecrackerInstanceExec,
} from './use-firecracker-instances';
import {
  useFirecrackerTemplates,
  useCreateFirecrackerTemplate,
  useDeleteFirecrackerTemplate,
} from './use-firecracker-templates';
import {
  useFirecrackerSnapshots,
  useCreateFirecrackerSnapshot,
  useDeleteFirecrackerSnapshot,
  useRestoreFirecrackerSnapshot,
} from './use-firecracker-snapshots';

export interface UseFirecrackerOptions {
  userId?: string;
  instanceId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useFirecracker(options: UseFirecrackerOptions = {}) {
  const { userId, instanceId } = options;

  // Instance hooks
  const instances = useFirecrackerInstances(userId);
  const instance = useFirecrackerInstance(instanceId);
  const logs = useFirecrackerInstanceLogs(instanceId);
  const createInstance = useCreateFirecrackerInstance();
  const instanceControl = useFirecrackerInstanceControl();
  const deleteInstance = useDeleteFirecrackerInstance();
  const instanceExec = useFirecrackerInstanceExec();

  // Template hooks
  const templates = useFirecrackerTemplates();
  const createTemplate = useCreateFirecrackerTemplate();
  const deleteTemplate = useDeleteFirecrackerTemplate();

  // Snapshot hooks
  const snapshots = useFirecrackerSnapshots(instanceId);
  const createSnapshot = useCreateFirecrackerSnapshot();
  const deleteSnapshot = useDeleteFirecrackerSnapshot();
  const restoreSnapshot = useRestoreFirecrackerSnapshot();

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      instances.mutate(),
      instance.mutate(),
      logs.mutate(),
      templates.mutate(),
      snapshots.mutate(),
    ]);
  }, [instances.mutate, instance.mutate, logs.mutate, templates.mutate, snapshots.mutate]);

  // Check if any operation is loading
  const isLoading = 
    instances.isLoading ||
    instance.isLoading ||
    logs.isLoading ||
    templates.isLoading ||
    snapshots.isLoading ||
    createInstance.isLoading ||
    instanceControl.isLoading ||
    deleteInstance.isLoading ||
    instanceExec.isLoading ||
    createTemplate.isLoading ||
    deleteTemplate.isLoading ||
    createSnapshot.isLoading ||
    deleteSnapshot.isLoading ||
    restoreSnapshot.isLoading;

  // Collect all errors
  const errors = [
    instances.isError,
    instance.isError,
    logs.isError,
    templates.isError,
    snapshots.isError,
    createInstance.error,
    instanceControl.error,
    deleteInstance.error,
    instanceExec.error,
    createTemplate.error,
    deleteTemplate.error,
    createSnapshot.error,
    deleteSnapshot.error,
    restoreSnapshot.error,
  ].filter(Boolean);

  return {
    // Data
    instances: instances.instances,
    instance: instance.instance,
    logs: logs.logs,
    templates: templates.templates,
    snapshots: snapshots.snapshots,

    // Instance operations
    createInstance: createInstance.createInstance,
    startInstance: instanceControl.startInstance,
    stopInstance: instanceControl.stopInstance,
    restartInstance: instanceControl.restartInstance,
    deleteInstance: deleteInstance.deleteInstance,
    executeCommand: instanceExec.executeCommand,

    // Template operations
    createTemplate: createTemplate.createTemplate,
    deleteTemplate: deleteTemplate.deleteTemplate,

    // Snapshot operations
    createSnapshot: createSnapshot.createSnapshot,
    deleteSnapshot: deleteSnapshot.deleteSnapshot,
    restoreSnapshot: restoreSnapshot.restoreSnapshot,

    // State
    isLoading,
    errors,
    hasErrors: errors.length > 0,

    // Actions
    refreshAll,
    refreshInstances: instances.mutate,
    refreshInstance: instance.mutate,
    refreshLogs: logs.mutate,
    refreshTemplates: templates.mutate,
    refreshSnapshots: snapshots.mutate,
  };
}

// Export individual hooks for granular usage
export {
  useFirecrackerInstances,
  useFirecrackerInstance,
  useFirecrackerInstanceLogs,
  useCreateFirecrackerInstance,
  useFirecrackerInstanceControl,
  useDeleteFirecrackerInstance,
  useFirecrackerInstanceExec,
} from './use-firecracker-instances';

export {
  useFirecrackerTemplates,
  useCreateFirecrackerTemplate,
  useDeleteFirecrackerTemplate,
} from './use-firecracker-templates';

export {
  useFirecrackerSnapshots,
  useCreateFirecrackerSnapshot,
  useDeleteFirecrackerSnapshot,
  useRestoreFirecrackerSnapshot,
} from './use-firecracker-snapshots';

export type {
  CreateInstanceRequest,
  CommandResult,
} from './use-firecracker-instances';

export type {
  CreateTemplateRequest,
} from './use-firecracker-templates';

export type {
  CreateSnapshotRequest,
} from './use-firecracker-snapshots';
