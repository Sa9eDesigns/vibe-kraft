/**
 * Base Infrastructure Service
 * Abstract base class for all infrastructure services
 */

import { config } from '@/lib/config/environment';
import { ApiResponse, ServiceHealth } from '../types';

export abstract class BaseInfrastructureService {
  protected readonly serviceName: string;
  protected readonly baseUrl: string;
  protected readonly timeout: number;
  protected readonly retryAttempts: number;

  constructor(serviceName: string, baseUrl: string, options?: ServiceOptions) {
    this.serviceName = serviceName;
    this.baseUrl = baseUrl;
    this.timeout = options?.timeout ?? 30000;
    this.retryAttempts = options?.retryAttempts ?? 3;
  }

  /**
   * Make authenticated HTTP request
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = this.timeout,
      retries = this.retryAttempts,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'VibeKraft/1.0',
      ...this.getAuthHeaders(),
      ...headers,
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          success: true,
          data,
          timestamp: new Date(),
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      timestamp: new Date(),
    };
  }

  /**
   * Get authentication headers for the service
   */
  protected abstract getAuthHeaders(): Record<string, string>;

  /**
   * Check service health
   */
  public async checkHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('/health', {
        timeout: 5000,
        retries: 0,
      });

      const responseTime = Date.now() - startTime;

      return {
        service: this.serviceName,
        status: response.success ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        responseTime,
        error: response.error,
        details: response.data as Record<string, unknown> | undefined,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        service: this.serviceName,
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Validate service configuration
   */
  protected validateConfig(requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => !this.getConfigValue(field));
    
    if (missingFields.length > 0) {
      throw new Error(
        `Missing required configuration for ${this.serviceName}: ${missingFields.join(', ')}`
      );
    }
  }

  /**
   * Get configuration value
   */
  protected getConfigValue(key: string): string | undefined {
    return process.env[key];
  }

  /**
   * Sleep utility for retry delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log service activity
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    if (config.logging.level === 'debug' || level !== 'info') {
      console[level](`[${this.serviceName}]`, message, data || '');
    }

    // In production, you might want to send logs to a centralized logging service
    if (config.isProduction && config.logging.sentryDsn) {
      // Send to Sentry or other logging service
    }
  }

  /**
   * Handle service errors
   */
  protected handleError(error: unknown, context: string): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.log('error', `${context}: ${errorMessage}`, error);
    throw new Error(`${this.serviceName} error in ${context}: ${errorMessage}`);
  }

  /**
   * Validate required parameters
   */
  protected validateParams(params: Record<string, unknown>, required: string[]): void {
    const missing = required.filter(key => params[key] === undefined || params[key] === null);
    
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * Format error response
   */
  protected formatError(error: unknown): ApiResponse {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      success: false,
      error: message,
      timestamp: new Date(),
    };
  }

  /**
   * Format success response
   */
  protected formatSuccess<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date(),
    };
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface ServiceOptions {
  timeout?: number;
  retryAttempts?: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// =============================================================================
// SERVICE REGISTRY
// =============================================================================

export class ServiceRegistry {
  private static services = new Map<string, BaseInfrastructureService>();

  static register(name: string, service: BaseInfrastructureService): void {
    this.services.set(name, service);
  }

  static get<T extends BaseInfrastructureService>(name: string): T | undefined {
    return this.services.get(name) as T;
  }

  static getAll(): Map<string, BaseInfrastructureService> {
    return new Map(this.services);
  }

  static async checkAllHealth(): Promise<ServiceHealth[]> {
    const healthChecks = Array.from(this.services.values()).map(service =>
      service.checkHealth()
    );

    return Promise.all(healthChecks);
  }
}

// =============================================================================
// DECORATORS
// =============================================================================

/**
 * Retry decorator for service methods
 */
export function retry(attempts: number = 3, delay: number = 1000) {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      let lastError: Error | undefined;

      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < attempts - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
          }
        }
      }

      throw lastError || new Error('Unknown error occurred');
    };

    return descriptor;
  };
}

/**
 * Cache decorator for service methods
 */
export function cache(ttl: number = 60000) {
  const cacheStore = new Map<string, { data: unknown; expires: number }>();

  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = `${(target as { constructor: { name: string } }).constructor.name}.${propertyKey}.${JSON.stringify(args)}`;
      const cached = cacheStore.get(cacheKey);

      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }

      const result = await originalMethod.apply(this, args);
      cacheStore.set(cacheKey, {
        data: result,
        expires: Date.now() + ttl,
      });

      return result;
    };

    return descriptor;
  };
}
