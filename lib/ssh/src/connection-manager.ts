/**
 * SSH Connection Manager with pooling and reconnection logic
 */

import { EventEmitter } from 'events';
import { SSHClient } from './client';
import {
  SSHConnectionConfig,
  SSHConnectionPoolConfig,
  SSHConnectionPoolStats,
  SSHReconnectionConfig
} from './types';
import { createSSHError, isRecoverableError } from './errors';

interface PooledConnection {
  id: string;
  client: SSHClient;
  config: SSHConnectionConfig;
  created: Date;
  lastUsed: Date;
  inUse: boolean;
  reconnectAttempts: number;
}

export interface ConnectionManagerOptions {
  poolConfig?: SSHConnectionPoolConfig;
  reconnectionConfig?: SSHReconnectionConfig;
  debug?: boolean;
  logger?: (level: string, message: string) => void;
}

export class SSHConnectionManager extends EventEmitter {
  private connections = new Map<string, PooledConnection>();
  private poolConfig: Required<SSHConnectionPoolConfig>;
  private reconnectionConfig: Required<SSHReconnectionConfig>;
  private options: ConnectionManagerOptions;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private nextConnectionId = 1;

  constructor(options: ConnectionManagerOptions = {}) {
    super();
    
    this.options = options;
    
    this.poolConfig = {
      maxConnections: 10,
      idleTimeout: 300000, // 5 minutes
      acquireTimeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000,
      ...options.poolConfig
    };

    this.reconnectionConfig = {
      enabled: true,
      maxAttempts: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
      ...options.reconnectionConfig
    };

    this.startCleanupTimer();
  }

  /**
   * Get or create a connection
   */
  async getConnection(config: SSHConnectionConfig): Promise<SSHClient> {
    const connectionKey = this.getConnectionKey(config);
    
    // Try to find an existing idle connection
    let pooledConnection = this.findIdleConnection(connectionKey);
    
    if (pooledConnection) {
      pooledConnection.inUse = true;
      pooledConnection.lastUsed = new Date();
      this.log('debug', `Reusing existing connection: ${pooledConnection.id}`);
      return pooledConnection.client;
    }

    // Check if we can create a new connection
    if (this.connections.size >= this.poolConfig.maxConnections) {
      // Try to clean up idle connections
      this.cleanupIdleConnections();
      
      if (this.connections.size >= this.poolConfig.maxConnections) {
        throw createSSHError(
          `Connection pool exhausted (max: ${this.poolConfig.maxConnections})`,
          'POOL_EXHAUSTED'
        );
      }
    }

    // Create new connection
    pooledConnection = await this.createConnection(config);
    this.connections.set(pooledConnection.id, pooledConnection);
    
    this.log('debug', `Created new connection: ${pooledConnection.id}`);
    return pooledConnection.client;
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(client: SSHClient): void {
    const pooledConnection = this.findConnectionByClient(client);
    
    if (pooledConnection) {
      pooledConnection.inUse = false;
      pooledConnection.lastUsed = new Date();
      this.log('debug', `Released connection: ${pooledConnection.id}`);
    }
  }

  /**
   * Close a specific connection
   */
  async closeConnection(client: SSHClient): Promise<void> {
    const pooledConnection = this.findConnectionByClient(client);
    
    if (pooledConnection) {
      await this.destroyConnection(pooledConnection);
      this.log('debug', `Closed connection: ${pooledConnection.id}`);
    }
  }

  /**
   * Close all connections
   */
  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connections.values()).map(
      connection => this.destroyConnection(connection)
    );
    
    await Promise.all(closePromises);
    this.connections.clear();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.log('debug', 'All connections closed');
  }

  /**
   * Get connection pool statistics
   */
  getStats(): SSHConnectionPoolStats {
    const total = this.connections.size;
    const active = Array.from(this.connections.values()).filter(c => c.inUse).length;
    const idle = total - active;
    
    return {
      total,
      active,
      idle,
      pending: 0 // TODO: Track pending connections
    };
  }

  /**
   * Create a new pooled connection
   */
  private async createConnection(config: SSHConnectionConfig): Promise<PooledConnection> {
    const id = `ssh-${this.nextConnectionId++}`;
    const clientOptions: any = {};
    if (this.options.debug !== undefined) {
      clientOptions.debug = this.options.debug;
    }
    if (this.options.logger !== undefined) {
      clientOptions.logger = this.options.logger;
    }

    const client = new SSHClient(config, clientOptions);

    const pooledConnection: PooledConnection = {
      id,
      client,
      config,
      created: new Date(),
      lastUsed: new Date(),
      inUse: true,
      reconnectAttempts: 0
    };

    // Set up reconnection handling
    if (this.reconnectionConfig.enabled) {
      this.setupReconnectionHandling(pooledConnection);
    }

    // Connect the client
    await client.connect();
    
    return pooledConnection;
  }

  /**
   * Set up automatic reconnection for a connection
   */
  private setupReconnectionHandling(pooledConnection: PooledConnection): void {
    const { client } = pooledConnection;

    client.on('error', async (error) => {
      if (!isRecoverableError(error) || !this.reconnectionConfig.enabled) {
        return;
      }

      if (pooledConnection.reconnectAttempts >= this.reconnectionConfig.maxAttempts) {
        this.log('error', `Max reconnection attempts reached for ${pooledConnection.id}`);
        await this.destroyConnection(pooledConnection);
        return;
      }

      pooledConnection.reconnectAttempts++;
      const delay = this.calculateReconnectionDelay(pooledConnection.reconnectAttempts);
      
      this.log('info', `Reconnecting ${pooledConnection.id} in ${delay}ms (attempt ${pooledConnection.reconnectAttempts})`);
      
      setTimeout(async () => {
        try {
          await client.connect();
          pooledConnection.reconnectAttempts = 0;
          this.log('info', `Successfully reconnected ${pooledConnection.id}`);
        } catch (reconnectError) {
          this.log('error', `Reconnection failed for ${pooledConnection.id}: ${reconnectError}`);
        }
      }, delay);
    });

    client.on('close', () => {
      if (pooledConnection.inUse && this.reconnectionConfig.enabled) {
        // Connection was closed unexpectedly while in use
        this.log('warn', `Connection ${pooledConnection.id} closed unexpectedly`);
      }
    });
  }

  /**
   * Calculate reconnection delay with exponential backoff and jitter
   */
  private calculateReconnectionDelay(attempt: number): number {
    const baseDelay = this.reconnectionConfig.initialDelay;
    const maxDelay = this.reconnectionConfig.maxDelay;
    const backoffFactor = this.reconnectionConfig.backoffFactor;
    
    let delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
    
    if (this.reconnectionConfig.jitter) {
      // Add random jitter (±25%)
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      delay += jitter;
    }
    
    return Math.max(delay, 0);
  }

  /**
   * Find an idle connection for the given configuration
   */
  private findIdleConnection(connectionKey: string): PooledConnection | undefined {
    for (const connection of this.connections.values()) {
      if (!connection.inUse && 
          this.getConnectionKey(connection.config) === connectionKey &&
          connection.client.isReady) {
        return connection;
      }
    }
    return undefined;
  }

  /**
   * Find connection by client instance
   */
  private findConnectionByClient(client: SSHClient): PooledConnection | undefined {
    for (const connection of this.connections.values()) {
      if (connection.client === client) {
        return connection;
      }
    }
    return undefined;
  }

  /**
   * Generate a unique key for connection configuration
   */
  private getConnectionKey(config: SSHConnectionConfig): string {
    return `${config.auth.username}@${config.host}:${config.port || 22}`;
  }

  /**
   * Destroy a pooled connection
   */
  private async destroyConnection(pooledConnection: PooledConnection): Promise<void> {
    try {
      await pooledConnection.client.disconnect();
    } catch (error) {
      this.log('warn', `Error disconnecting ${pooledConnection.id}: ${error}`);
    }
    
    this.connections.delete(pooledConnection.id);
  }

  /**
   * Clean up idle connections
   */
  private cleanupIdleConnections(): void {
    const now = new Date();
    const connectionsToRemove: PooledConnection[] = [];

    for (const connection of this.connections.values()) {
      if (!connection.inUse) {
        const idleTime = now.getTime() - connection.lastUsed.getTime();
        if (idleTime > this.poolConfig.idleTimeout) {
          connectionsToRemove.push(connection);
        }
      }
    }

    connectionsToRemove.forEach(connection => {
      this.log('debug', `Cleaning up idle connection: ${connection.id}`);
      this.destroyConnection(connection);
    });
  }

  /**
   * Start the cleanup timer
   */
  private startCleanupTimer(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000);
  }

  /**
   * Log message
   */
  private log(level: string, message: string): void {
    if (this.options.logger) {
      this.options.logger(level, `[ConnectionManager] ${message}`);
    } else if (this.options.debug) {
      console.log(`[SSH ConnectionManager ${level.toUpperCase()}] ${message}`);
    }
  }
}
