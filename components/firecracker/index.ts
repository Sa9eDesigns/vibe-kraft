/**
 * Firecracker Components Index
 * Centralized exports for all Firecracker workspace components
 */

// Main Components
export { WorkspaceLauncher } from './workspace-launcher';
export { WorkspaceDashboard } from './workspace-dashboard';
export { WorkspaceInstance } from './workspace-instance';
export { WorkspaceMetrics } from './workspace-metrics';
export { WorkspaceTerminal } from './workspace-terminal';
export { WorkspaceSnapshots } from './workspace-snapshots';
export { TemplateManager } from './template-manager';

// Component Types
export type {
  WorkspaceLauncherProps,
  LaunchConfig,
} from './workspace-launcher';

export type {
  WorkspaceDashboardProps,
} from './workspace-dashboard';

export type {
  WorkspaceInstanceProps,
} from './workspace-instance';

export type {
  WorkspaceMetricsProps,
  MetricCardProps,
} from './workspace-metrics';

export type {
  WorkspaceTerminalProps,
  TerminalSession,
  TerminalLine,
} from './workspace-terminal';

export type {
  WorkspaceSnapshotsProps,
  CreateSnapshotData,
} from './workspace-snapshots';

export type {
  TemplateManagerProps,
  CreateTemplateData,
} from './template-manager';
