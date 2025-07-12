/**
 * Infrastructure Types
 * Type definitions for VibeKraft infrastructure components
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface BaseResource {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  status: ResourceStatus;
  metadata?: Record<string, unknown>;
}

export type ResourceStatus = 
  | 'creating'
  | 'running'
  | 'stopped'
  | 'error'
  | 'deleting'
  | 'unknown';

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  timestamp: Date;
}

// =============================================================================
// STORAGE TYPES (MinIO)
// =============================================================================

export interface StorageBucket extends BaseResource {
  size: number;
  objectCount: number;
  region: string;
  versioning: boolean;
  encryption: boolean;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StorageUploadRequest {
  file: File;
  key: string;
  bucket: string;
  metadata?: Record<string, string>;
}

export interface StorageDownloadRequest {
  key: string;
  bucket: string;
}

export interface StorageUsage {
  totalSize: number;
  objectCount: number;
  bucketCount: number;
  quota: number;
  quotaUsed: number;
}

// =============================================================================
// CONTAINER TYPES (Docker)
// =============================================================================

export interface Container extends BaseResource {
  image: string;
  command: string[];
  ports: ContainerPort[];
  volumes: ContainerVolume[];
  environment: Record<string, string>;
  restartPolicy: RestartPolicy;
  networkMode: string;
  labels: Record<string, string>;
}

export interface ContainerPort {
  containerPort: number;
  hostPort?: number;
  protocol: 'tcp' | 'udp';
}

export interface ContainerVolume {
  hostPath: string;
  containerPath: string;
  readOnly: boolean;
}

export type RestartPolicy = 'no' | 'always' | 'unless-stopped' | 'on-failure';

export interface ContainerStats {
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  networkRx: number;
  networkTx: number;
  blockRead: number;
  blockWrite: number;
}

// =============================================================================
// WEBVM TYPES (Firecracker)
// =============================================================================

export interface WebVMInstance extends BaseResource {
  userId: string;
  workspaceId: string;
  image: string;
  memory: string;
  cpuCount: number;
  diskSize: string;
  networkConfig: NetworkConfig;
  connectionUrl: string;
  sshPort: number;
  vnc: boolean;
  vncPort?: number;
}

export interface NetworkConfig {
  ipAddress: string;
  subnet: string;
  gateway: string;
  dns: string[];
}

export interface WebVMTemplate {
  id: string;
  name: string;
  description: string;
  image: string;
  memory: string;
  cpuCount: number;
  diskSize: string;
  preInstalledSoftware: string[];
  category: 'development' | 'data-science' | 'web' | 'mobile' | 'custom';
}

export interface WebVMSnapshot {
  id: string;
  instanceId: string;
  name: string;
  description?: string;
  size: number;
  createdAt: Date;
}

// =============================================================================
// METRICS TYPES (Prometheus)
// =============================================================================

export interface MetricQuery {
  query: string;
  start?: Date;
  end?: Date;
  step?: string;
}

export interface MetricResult {
  metric: Record<string, string>;
  values: [number, string][];
}

export interface MetricResponse {
  status: 'success' | 'error';
  data: {
    resultType: 'matrix' | 'vector' | 'scalar' | 'string';
    result: MetricResult[];
  };
  error?: string;
}

export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  panels: DashboardPanel[];
  timeRange: TimeRange;
  refreshInterval: string;
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: 'graph' | 'stat' | 'table' | 'heatmap';
  queries: MetricQuery[];
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TimeRange {
  from: string;
  to: string;
}

// =============================================================================
// WORKSPACE TYPES
// =============================================================================

export interface Workspace extends BaseResource {
  userId: string;
  projectId?: string;
  type: 'webvm' | 'container' | 'hybrid';
  configuration: WorkspaceConfig;
  resources: WorkspaceResources;
  persistence: PersistenceConfig;
}

export interface WorkspaceConfig {
  image: string;
  environment: Record<string, string>;
  ports: number[];
  volumes: string[];
  commands: string[];
}

export interface WorkspaceResources {
  cpu: string;
  memory: string;
  disk: string;
  gpu?: string;
}

export interface PersistenceConfig {
  enabled: boolean;
  storageClass: string;
  size: string;
  backupSchedule?: string;
}

// =============================================================================
// INFRASTRUCTURE HEALTH TYPES
// =============================================================================

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  lastCheck: Date;
  responseTime: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface InfrastructureHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: ServiceHealth[];
  lastUpdated: Date;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// WEBHOOK TYPES
// =============================================================================

export interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: Record<string, unknown>;
  signature: string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: Date;
}

// =============================================================================
// AUDIT LOG TYPES
// =============================================================================

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export type AuditAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'start'
  | 'stop'
  | 'restart'
  | 'backup'
  | 'restore';

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
