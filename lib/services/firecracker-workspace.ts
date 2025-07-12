import { db } from "@/lib/db";
import { 
  FirecrackerWorkspaceConfig, 
  FirecrackerVMConfig, 
  FirecrackerVMResources,
  CreateFirecrackerWorkspaceRequest,
  UpdateFirecrackerWorkspaceRequest,
  FirecrackerVMStatus,
  ContainerConfig,
  CreateContainerRequest
} from "@/lib/types/firecracker";

export class FirecrackerWorkspaceService {
  
  /**
   * Create a new Firecracker workspace
   */
  static async createWorkspace(request: CreateFirecrackerWorkspaceRequest) {
    try {
      // Get template if specified
      let template = null;
      if (request.template_id) {
        template = await db.firecrackerTemplate.findUnique({
          where: { id: request.template_id }
        });
        if (!template) {
          throw new Error('Template not found');
        }
      }

      // Create workspace
      const workspace = await db.workspace.create({
        data: {
          name: request.name,
          description: request.description,
          projectId: request.project_id,
          type: 'FIRECRACKER',
          status: 'INACTIVE',
          config: request.config || {}
        }
      });

      // Create Firecracker VM
      const vmConfig = this.buildVMConfig(request.config, request.resources, template);
      const vm = await db.firecrackerVM.create({
        data: {
          name: `${request.name}-vm`,
          workspaceId: workspace.id,
          vmId: `fc-${workspace.id}`,
          status: 'STOPPED',
          config: vmConfig,
          resources: request.resources || this.getDefaultResources(),
          templateId: request.template_id,
          kernelImage: template?.kernelImage || '/opt/firecracker/kernels/vmlinux.bin',
          rootfsImage: template?.rootfsImage || '/opt/firecracker/rootfs/ubuntu.ext4'
        }
      });

      return {
        workspace,
        vm
      };
    } catch (error) {
      console.error('Error creating Firecracker workspace:', error);
      throw error;
    }
  }

  /**
   * Start a Firecracker VM
   */
  static async startVM(vmId: string): Promise<FirecrackerVMStatus> {
    try {
      const vm = await db.firecrackerVM.findUnique({
        where: { id: vmId },
        include: { workspace: true }
      });

      if (!vm) {
        throw new Error('VM not found');
      }

      // Update status to starting
      await db.firecrackerVM.update({
        where: { id: vmId },
        data: { 
          status: 'STARTING',
          startedAt: new Date()
        }
      });

      // Generate paths
      const socketPath = `/tmp/firecracker-${vm.vmId}.socket`;
      const logPath = `/var/log/firecracker/${vm.vmId}.log`;
      const metricsPath = `/var/log/firecracker/${vm.vmId}-metrics.log`;

      // Start Firecracker VM (this would integrate with actual Firecracker API)
      const vmStatus = await this.startFirecrackerProcess(vm, socketPath, logPath, metricsPath);

      // Update VM with connection details
      await db.firecrackerVM.update({
        where: { id: vmId },
        data: {
          status: 'RUNNING',
          socketPath,
          logPath,
          metricsPath
        }
      });

      // Update workspace status
      await db.workspace.update({
        where: { id: vm.workspaceId },
        data: { status: 'ACTIVE' }
      });

      return vmStatus;
    } catch (error) {
      // Update status to error
      await db.firecrackerVM.update({
        where: { id: vmId },
        data: { status: 'ERROR' }
      });
      
      console.error('Error starting Firecracker VM:', error);
      throw error;
    }
  }

  /**
   * Stop a Firecracker VM
   */
  static async stopVM(vmId: string): Promise<void> {
    try {
      const vm = await db.firecrackerVM.findUnique({
        where: { id: vmId }
      });

      if (!vm) {
        throw new Error('VM not found');
      }

      // Update status to stopping
      await db.firecrackerVM.update({
        where: { id: vmId },
        data: { status: 'STOPPING' }
      });

      // Stop Firecracker VM process
      await this.stopFirecrackerProcess(vm.vmId, vm.socketPath);

      // Update VM status
      await db.firecrackerVM.update({
        where: { id: vmId },
        data: {
          status: 'STOPPED',
          stoppedAt: new Date()
        }
      });

      // Update workspace status
      await db.workspace.update({
        where: { id: vm.workspaceId },
        data: { status: 'INACTIVE' }
      });
    } catch (error) {
      console.error('Error stopping Firecracker VM:', error);
      throw error;
    }
  }

  /**
   * Create a container within a Firecracker VM
   */
  static async createContainer(request: CreateContainerRequest) {
    try {
      const vm = await db.firecrackerVM.findUnique({
        where: { id: request.vm_id }
      });

      if (!vm || vm.status !== 'RUNNING') {
        throw new Error('VM not found or not running');
      }

      // Create container record
      const container = await db.firecrackerContainer.create({
        data: {
          vmId: request.vm_id,
          name: request.config.name,
          image: request.config.image,
          status: 'CREATING',
          config: request.config,
          ports: request.config.ports || [],
          volumes: request.config.volumes || [],
          environment: request.config.environment || {},
          command: request.config.command?.join(' '),
          workingDir: request.config.working_dir
        }
      });

      // Start container in VM (this would use Docker API within the VM)
      await this.startContainerInVM(vm, container.id, request.config);

      // Update container status
      await db.firecrackerContainer.update({
        where: { id: container.id },
        data: {
          status: 'RUNNING',
          startedAt: new Date()
        }
      });

      return container;
    } catch (error) {
      console.error('Error creating container:', error);
      throw error;
    }
  }

  /**
   * Get workspace with VM and containers
   */
  static async getWorkspace(workspaceId: string) {
    return await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        project: true,
        firecrackerVMs: {
          include: {
            containers: true,
            metrics: {
              orderBy: { timestamp: 'desc' },
              take: 10
            },
            snapshots: true,
            template: true
          }
        }
      }
    });
  }

  /**
   * Get VM metrics
   */
  static async getVMMetrics(vmId: string, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await db.firecrackerMetric.findMany({
      where: {
        vmId,
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'asc' }
    });
  }

  /**
   * Create VM snapshot
   */
  static async createSnapshot(vmId: string, name: string, description?: string) {
    try {
      const vm = await db.firecrackerVM.findUnique({
        where: { id: vmId }
      });

      if (!vm) {
        throw new Error('VM not found');
      }

      // Create snapshot using Firecracker API
      const snapshotPath = `/var/snapshots/${vm.vmId}/${name}.snapshot`;
      const memoryPath = `/var/snapshots/${vm.vmId}/${name}.memory`;
      
      await this.createVMSnapshot(vm.vmId, vm.socketPath, snapshotPath, memoryPath);

      // Record snapshot in database
      const snapshot = await db.firecrackerSnapshot.create({
        data: {
          vmId,
          name,
          description,
          snapshotPath,
          memoryPath,
          size: BigInt(0) // Would be populated after snapshot creation
        }
      });

      return snapshot;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw error;
    }
  }

  // Private helper methods

  private static buildVMConfig(
    config?: Partial<FirecrackerWorkspaceConfig>,
    resources?: Partial<FirecrackerVMResources>,
    template?: any
  ): FirecrackerVMConfig {
    const defaultResources = this.getDefaultResources();
    const vmResources = { ...defaultResources, ...resources };

    return {
      vcpu_count: vmResources.cpu,
      mem_size_mib: vmResources.memory,
      kernel_image_path: template?.kernelImage || '/opt/firecracker/kernels/vmlinux.bin',
      boot_args: 'console=ttyS0 reboot=k panic=1 pci=off',
      drives: [
        {
          drive_id: 'rootfs',
          path_on_host: template?.rootfsImage || '/opt/firecracker/rootfs/ubuntu.ext4',
          is_root_device: true,
          is_read_only: false
        }
      ],
      network_interfaces: [
        {
          iface_id: 'eth0',
          host_dev_name: 'tap0'
        }
      ],
      logger: {
        log_path: '/var/log/firecracker/vm.log',
        level: 'Info',
        show_level: true,
        show_log_origin: true
      },
      metrics: {
        metrics_path: '/var/log/firecracker/metrics.log'
      }
    };
  }

  private static getDefaultResources(): FirecrackerVMResources {
    return {
      cpu: 2,
      memory: 2048, // 2GB
      disk: 20, // 20GB
      network_bandwidth: 1000 // 1Gbps
    };
  }

  private static async startFirecrackerProcess(
    vm: any,
    socketPath: string,
    logPath: string,
    metricsPath: string
  ): Promise<FirecrackerVMStatus> {
    // This would integrate with actual Firecracker binary
    // For now, return a mock status
    return {
      id: vm.id,
      status: 'RUNNING',
      socket_path: socketPath,
      log_path: logPath,
      metrics_path: metricsPath,
      started_at: new Date()
    };
  }

  private static async stopFirecrackerProcess(vmId: string, socketPath?: string): Promise<void> {
    // This would send shutdown command to Firecracker via API socket
    console.log(`Stopping Firecracker VM ${vmId} via socket ${socketPath}`);
  }

  private static async startContainerInVM(vm: any, containerId: string, config: ContainerConfig): Promise<void> {
    // This would execute Docker commands within the VM via SSH or agent
    console.log(`Starting container ${containerId} in VM ${vm.id} with config:`, config);
  }

  private static async createVMSnapshot(
    vmId: string,
    socketPath?: string,
    snapshotPath?: string,
    memoryPath?: string
  ): Promise<void> {
    // This would use Firecracker snapshot API
    console.log(`Creating snapshot for VM ${vmId} at ${snapshotPath}`);
  }
}
