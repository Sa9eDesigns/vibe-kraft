/**
 * Infrastructure Services Index
 * Centralized export and initialization of all infrastructure services
 */

import { ServiceRegistry, BaseInfrastructureService } from './base';
import { storageService } from './storage';
import { metricsService } from './metrics';
import { firecrackerService } from './firecracker';
import { dockerService } from './docker';
import { config } from '@/lib/config/environment';
import { InfrastructureHealth, ServiceHealth } from '../types';

// =============================================================================
// SERVICE EXPORTS
// =============================================================================

export { storageService } from './storage';
export { metricsService } from './metrics';
export { firecrackerService } from './firecracker';
export { dockerService } from './docker';
export { BaseInfrastructureService, ServiceRegistry } from './base';

// =============================================================================
// SERVICE INITIALIZATION
// =============================================================================

/**
 * Initialize all infrastructure services
 */
export function initializeServices(): void {
  // Register all services with the service registry
  ServiceRegistry.register('storage', storageService);
  ServiceRegistry.register('metrics', metricsService);
  ServiceRegistry.register('firecracker', firecrackerService);
  ServiceRegistry.register('docker', dockerService);

  console.log('✅ Infrastructure services initialized');
}

// =============================================================================
// HEALTH CHECK UTILITIES
// =============================================================================

/**
 * Check health of all infrastructure services
 */
export async function checkInfrastructureHealth(): Promise<InfrastructureHealth> {
  try {
    const serviceHealthChecks = await ServiceRegistry.checkAllHealth();
    
    const healthyServices = serviceHealthChecks.filter(h => h.status === 'healthy').length;
    const totalServices = serviceHealthChecks.length;
    
    let overall: InfrastructureHealth['overall'];
    if (healthyServices === totalServices) {
      overall = 'healthy';
    } else if (healthyServices > totalServices / 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      services: serviceHealthChecks,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Failed to check infrastructure health:', error);
    
    return {
      overall: 'unhealthy',
      services: [],
      lastUpdated: new Date(),
    };
  }
}

/**
 * Check health of a specific service
 */
export async function checkServiceHealth(serviceName: string): Promise<ServiceHealth | null> {
  try {
    const service = ServiceRegistry.get(serviceName);
    if (!service) {
      return null;
    }

    return await service.checkHealth();
  } catch (error) {
    console.error(`Failed to check health for service ${serviceName}:`, error);
    
    return {
      service: serviceName,
      status: 'unhealthy',
      lastCheck: new Date(),
      responseTime: 0,
      error: (error as Error).message,
    };
  }
}

// =============================================================================
// SERVICE MANAGEMENT UTILITIES
// =============================================================================

/**
 * Get all registered services
 */
export function getAllServices() {
  return ServiceRegistry.getAll();
}

/**
 * Get a specific service by name
 */
export function getService<T extends BaseInfrastructureService>(serviceName: string): T | undefined {
  return ServiceRegistry.get<T>(serviceName);
}

/**
 * Check if a service is enabled based on feature flags
 */
export function isServiceEnabled(serviceName: string): boolean {
  const featureMap: Record<string, boolean> = {
    storage: config.features.storage,
    metrics: config.features.metrics,
    firecracker: config.features.firecracker,
    docker: true, // Docker is always enabled
  };

  return featureMap[serviceName] ?? false;
}

/**
 * Get enabled services only
 */
export function getEnabledServices() {
  const allServices = getAllServices();
  const enabledServices = new Map();

  for (const [name, service] of allServices) {
    if (isServiceEnabled(name)) {
      enabledServices.set(name, service);
    }
  }

  return enabledServices;
}

// =============================================================================
// MONITORING UTILITIES
// =============================================================================

/**
 * Get service metrics for monitoring dashboard
 */
export async function getServiceMetrics(): Promise<ServiceMetrics> {
  const services = getEnabledServices();
  const metrics: ServiceMetrics = {
    totalServices: services.size,
    healthyServices: 0,
    unhealthyServices: 0,
    degradedServices: 0,
    averageResponseTime: 0,
    lastUpdated: new Date(),
  };

  const healthChecks = await Promise.all(
    Array.from(services.values()).map(service => service.checkHealth())
  );

  let totalResponseTime = 0;

  healthChecks.forEach(health => {
    switch (health.status) {
      case 'healthy':
        metrics.healthyServices++;
        break;
      case 'unhealthy':
        metrics.unhealthyServices++;
        break;
      case 'degraded':
        metrics.degradedServices++;
        break;
    }
    
    totalResponseTime += health.responseTime;
  });

  metrics.averageResponseTime = totalResponseTime / healthChecks.length;

  return metrics;
}

/**
 * Get service uptime statistics
 */
export async function getServiceUptime(): Promise<ServiceUptime[]> {
  const services = getEnabledServices();
  const uptimeStats: ServiceUptime[] = [];

  for (const [name, service] of services) {
    try {
      const health = await service.checkHealth();
      
      // In a real implementation, you would track uptime over time
      // For now, we'll simulate based on current health status
      const uptime = health.status === 'healthy' ? 99.9 : 
                   health.status === 'degraded' ? 95.0 : 0.0;

      uptimeStats.push({
        service: name,
        uptime,
        lastDowntime: health.status !== 'healthy' ? new Date() : undefined,
        totalDowntime: 0, // Would be calculated from historical data
      });
    } catch (error) {
      uptimeStats.push({
        service: name,
        uptime: 0,
        lastDowntime: new Date(),
        totalDowntime: 0,
      });
    }
  }

  return uptimeStats;
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Handle service errors with proper logging and recovery
 */
export function handleServiceError(serviceName: string, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  console.error(`[${serviceName}] Service error:`, errorMessage);
  
  // In production, you might want to:
  // 1. Send alerts to monitoring systems
  // 2. Attempt automatic recovery
  // 3. Update service status in database
  // 4. Notify administrators
  
  if (config.logging.sentryDsn) {
    // Send to Sentry or other error tracking service
  }
}

/**
 * Retry failed service operations
 */
export async function retryServiceOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError!;
}

// =============================================================================
// TYPES
// =============================================================================

export interface ServiceMetrics {
  totalServices: number;
  healthyServices: number;
  unhealthyServices: number;
  degradedServices: number;
  averageResponseTime: number;
  lastUpdated: Date;
}

export interface ServiceUptime {
  service: string;
  uptime: number; // Percentage
  lastDowntime?: Date;
  totalDowntime: number; // Minutes
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Auto-initialize services when module is imported
if (typeof window === 'undefined') {
  // Only initialize on server-side
  initializeServices();
}
