// Firecracker Workspace Types and Interfaces

export interface FirecrackerVMConfig {
  // VM Configuration
  vcpu_count: number;
  mem_size_mib: number;
  ht_enabled?: boolean;
  cpu_template?: 'C3' | 'T2' | 'T2S' | 'T2CL' | 'T2A' | 'V1N1';
  
  // Boot Configuration
  kernel_image_path: string;
  initrd_path?: string;
  boot_args?: string;
  
  // Drives Configuration
  drives: FirecrackerDrive[];
  
  // Network Configuration
  network_interfaces?: FirecrackerNetworkInterface[];
  
  // Logging Configuration
  logger?: {
    log_path: string;
    level: 'Error' | 'Warn' | 'Info' | 'Debug' | 'Trace';
    show_level: boolean;
    show_log_origin: boolean;
  };
  
  // Metrics Configuration
  metrics?: {
    metrics_path: string;
  };
  
  // Machine Configuration
  machine_config?: {
    vcpu_count: number;
    mem_size_mib: number;
    ht_enabled: boolean;
    track_dirty_pages: boolean;
  };
}

export interface FirecrackerDrive {
  drive_id: string;
  path_on_host: string;
  is_root_device: boolean;
  is_read_only: boolean;
  cache_type?: 'Unsafe' | 'Writeback';
  io_engine?: 'Sync' | 'Async';
  rate_limiter?: {
    bandwidth?: {
      size: number;
      one_time_burst?: number;
      refill_time: number;
    };
    ops?: {
      size: number;
      one_time_burst?: number;
      refill_time: number;
    };
  };
}

export interface FirecrackerNetworkInterface {
  iface_id: string;
  guest_mac?: string;
  host_dev_name: string;
  rx_rate_limiter?: FirecrackerRateLimiter;
  tx_rate_limiter?: FirecrackerRateLimiter;
}

export interface FirecrackerRateLimiter {
  bandwidth?: {
    size: number;
    one_time_burst?: number;
    refill_time: number;
  };
  ops?: {
    size: number;
    one_time_burst?: number;
    refill_time: number;
  };
}

export interface FirecrackerVMResources {
  cpu: number;
  memory: number; // in MiB
  disk: number; // in GB
  network_bandwidth?: number; // in Mbps
}

export interface FirecrackerWorkspaceConfig {
  // VM Configuration
  vm: FirecrackerVMConfig;
  
  // Container Runtime Configuration
  container_runtime: 'docker' | 'containerd' | 'podman';
  
  // Development Environment
  environment: {
    shell: string;
    editor: string;
    git_config?: {
      user_name?: string;
      user_email?: string;
    };
    ssh_keys?: string[];
    environment_variables?: Record<string, string>;
  };
  
  // Workspace Features
  features: {
    ai_assistant: boolean;
    file_sync: boolean;
    port_forwarding: boolean;
    vnc_access: boolean;
    ssh_access: boolean;
  };
  
  // Security Configuration
  security: {
    enable_seccomp: boolean;
    enable_apparmor: boolean;
    readonly_rootfs: boolean;
    user_namespace: boolean;
  };
}

export interface ContainerConfig {
  image: string;
  name: string;
  command?: string[];
  args?: string[];
  working_dir?: string;
  environment?: Record<string, string>;
  ports?: PortMapping[];
  volumes?: VolumeMount[];
  labels?: Record<string, string>;
  restart_policy?: 'no' | 'always' | 'unless-stopped' | 'on-failure';
  resource_limits?: {
    cpu?: string; // e.g., "0.5" for 0.5 CPU
    memory?: string; // e.g., "512m" for 512MB
    pids?: number;
  };
  security_opts?: string[];
  capabilities?: {
    add?: string[];
    drop?: string[];
  };
}

export interface PortMapping {
  host_port: number;
  container_port: number;
  protocol: 'tcp' | 'udp';
  host_ip?: string;
}

export interface VolumeMount {
  source: string;
  target: string;
  type: 'bind' | 'volume' | 'tmpfs';
  read_only?: boolean;
  bind_options?: {
    propagation?: 'rprivate' | 'private' | 'rshared' | 'shared' | 'rslave' | 'slave';
  };
}

export interface FirecrackerVMStatus {
  id: string;
  status: 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'ERROR' | 'SUSPENDED' | 'PAUSED';
  pid?: number;
  socket_path: string;
  log_path: string;
  metrics_path?: string;
  started_at?: Date;
  stopped_at?: Date;
  error_message?: string;
}

export interface ContainerStatus {
  id: string;
  name: string;
  image: string;
  status: 'CREATING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'DELETING';
  state: {
    running: boolean;
    paused: boolean;
    restarting: boolean;
    oom_killed: boolean;
    dead: boolean;
    pid: number;
    exit_code: number;
    error: string;
    started_at: Date;
    finished_at?: Date;
  };
  ports?: PortMapping[];
  mounts?: VolumeMount[];
}

export interface FirecrackerMetrics {
  vm_id: string;
  timestamp: Date;
  cpu_utilization: number;
  memory_utilization: number;
  memory_used_mb: number;
  memory_available_mb: number;
  disk_read_bytes: number;
  disk_write_bytes: number;
  network_rx_bytes: number;
  network_tx_bytes: number;
  network_rx_packets: number;
  network_tx_packets: number;
  uptime_seconds: number;
}

export interface ContainerMetrics {
  container_id: string;
  timestamp: Date;
  cpu_percent: number;
  memory_usage_mb: number;
  memory_limit_mb: number;
  memory_percent: number;
  network_rx_bytes: number;
  network_tx_bytes: number;
  block_read_bytes: number;
  block_write_bytes: number;
  pids: number;
}

export interface FirecrackerTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  kernel_image: string;
  rootfs_image: string;
  config: FirecrackerWorkspaceConfig;
  resources: FirecrackerVMResources;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FirecrackerWorkspace {
  id: string;
  name: string;
  description?: string;
  project_id: string;
  vm: FirecrackerVMStatus;
  containers: ContainerStatus[];
  config: FirecrackerWorkspaceConfig;
  template_id?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'ERROR';
  created_at: Date;
  updated_at: Date;
}

// API Request/Response Types
export interface CreateFirecrackerWorkspaceRequest {
  name: string;
  description?: string;
  project_id: string;
  template_id?: string;
  config?: Partial<FirecrackerWorkspaceConfig>;
  resources?: Partial<FirecrackerVMResources>;
}

export interface UpdateFirecrackerWorkspaceRequest {
  name?: string;
  description?: string;
  config?: Partial<FirecrackerWorkspaceConfig>;
  resources?: Partial<FirecrackerVMResources>;
}

export interface CreateContainerRequest {
  vm_id: string;
  config: ContainerConfig;
}

export interface UpdateContainerRequest {
  config: Partial<ContainerConfig>;
}

export interface FirecrackerAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Event Types
export interface FirecrackerEvent {
  type: 'vm_started' | 'vm_stopped' | 'vm_error' | 'container_started' | 'container_stopped' | 'container_error' | 'metrics_updated';
  vm_id?: string;
  container_id?: string;
  timestamp: Date;
  data?: any;
  error?: string;
}
