/**
 * React hook for SSH connections
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SSHClient } from '../client';
import { SSHConnectionManager } from '../connection-manager';
import {
  SSHConnectionConfig,
  SSHConnectionState,
  SSHCommandOptions,
  SSHCommandResult
} from '../types';
import { createSSHError } from '../errors';

export interface UseSSHConnectionOptions {
  autoConnect?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  onStateChange?: (state: SSHConnectionState) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface UseSSHConnectionReturn {
  // Connection state
  client: SSHClient | null;
  state: SSHConnectionState;
  isConnected: boolean;
  isReady: boolean;
  error: Error | null;
  
  // Connection actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  
  // Command execution
  executeCommand: (command: string, options?: SSHCommandOptions) => Promise<SSHCommandResult>;
  
  // Connection info
  connectionInfo: {
    host: string;
    port: number;
    username: string;
    connectedAt: Date | null;
    lastActivity: Date | null;
  } | null;
}

// Global connection manager instance
let globalConnectionManager: SSHConnectionManager | null = null;

function getConnectionManager(): SSHConnectionManager {
  if (!globalConnectionManager) {
    globalConnectionManager = new SSHConnectionManager({
      debug: process.env.NODE_ENV === 'development'
    });
  }
  return globalConnectionManager;
}

export function useSSHConnection(
  config: SSHConnectionConfig,
  options: UseSSHConnectionOptions = {}
): UseSSHConnectionReturn {
  const [client, setClient] = useState<SSHClient | null>(null);
  const [state, setState] = useState<SSHConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<UseSSHConnectionReturn['connectionInfo']>(null);

  const connectionManager = useRef(getConnectionManager());
  const connectPromise = useRef<Promise<void> | null>(null);
  const retryCount = useRef(0);
  const lastActivity = useRef<Date | null>(null);

  const {
    autoConnect = false,
    retryAttempts = 3,
    retryDelay = 1000,
    onStateChange,
    onError,
    onConnect,
    onDisconnect
  } = options;

  // Update connection info when client changes
  useEffect(() => {
    if (client && state === 'ready') {
      setConnectionInfo({
        host: config.host,
        port: config.port || 22,
        username: config.auth.username,
        connectedAt: new Date(),
        lastActivity: lastActivity.current
      });
    } else {
      setConnectionInfo(null);
    }
  }, [client, state, config]);

  // Set up client event handlers
  useEffect(() => {
    if (!client) return;

    const handleStateChange = (newState: SSHConnectionState) => {
      setState(newState);
      onStateChange?.(newState);
    };

    const handleError = (err: Error) => {
      setError(err);
      onError?.(err);
    };

    const handleConnect = () => {
      setError(null);
      retryCount.current = 0;
      onConnect?.();
    };

    const handleDisconnect = () => {
      onDisconnect?.();
    };

    client.on('stateChange', handleStateChange);
    client.on('error', handleError);
    client.on('ready', handleConnect);
    client.on('close', handleDisconnect);
    client.on('end', handleDisconnect);

    return () => {
      client.removeListener('stateChange', handleStateChange);
      client.removeListener('error', handleError);
      client.removeListener('ready', handleConnect);
      client.removeListener('close', handleDisconnect);
      client.removeListener('end', handleDisconnect);
    };
  }, [client, onStateChange, onError, onConnect, onDisconnect]);

  // Connect function
  const connect = useCallback(async (): Promise<void> => {
    if (connectPromise.current) {
      return connectPromise.current;
    }

    if (client?.isConnected) {
      return;
    }

    connectPromise.current = (async () => {
      try {
        setError(null);
        setState('connecting');

        const newClient = await connectionManager.current.getConnection(config);
        setClient(newClient);
        
        if (!newClient.isReady) {
          await newClient.connect();
        }

        lastActivity.current = new Date();
        
      } catch (err) {
        const sshError = createSSHError(
          `Failed to connect: ${err}`,
          'CONNECTION_ERROR'
        );
        
        setError(sshError);
        setState('error');
        
        // Retry logic
        if (retryCount.current < retryAttempts) {
          retryCount.current++;
          setTimeout(() => {
            connectPromise.current = null;
            connect();
          }, retryDelay * retryCount.current);
        }
        
        throw sshError;
      } finally {
        connectPromise.current = null;
      }
    })();

    return connectPromise.current;
  }, [config, retryAttempts, retryDelay]);

  // Disconnect function
  const disconnect = useCallback(async (): Promise<void> => {
    if (!client) return;

    try {
      connectionManager.current.releaseConnection(client);
      setClient(null);
      setState('disconnected');
      setError(null);
      lastActivity.current = null;
    } catch (err) {
      const sshError = createSSHError(
        `Failed to disconnect: ${err}`,
        'DISCONNECTION_ERROR'
      );
      setError(sshError);
      throw sshError;
    }
  }, [client]);

  // Reconnect function
  const reconnect = useCallback(async (): Promise<void> => {
    await disconnect();
    await connect();
  }, [disconnect, connect]);

  // Execute command function
  const executeCommand = useCallback(async (
    command: string,
    commandOptions: SSHCommandOptions = {}
  ): Promise<SSHCommandResult> => {
    if (!client) {
      throw createSSHError('No SSH connection available', 'NO_CONNECTION');
    }

    try {
      lastActivity.current = new Date();
      const result = await client.executeCommand(command, commandOptions);
      lastActivity.current = new Date();
      return result;
    } catch (err) {
      const sshError = createSSHError(
        `Command execution failed: ${err}`,
        'COMMAND_ERROR'
      );
      setError(sshError);
      throw sshError;
    }
  }, [client]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect().catch(() => {
        // Error is already handled in connect function
      });
    }

    // Cleanup on unmount
    return () => {
      if (client) {
        connectionManager.current.releaseConnection(client);
      }
    };
  }, [autoConnect, connect]);

  // Derived state
  const isConnected = state !== 'disconnected' && state !== 'error';
  const isReady = state === 'ready';

  return {
    client,
    state,
    isConnected,
    isReady,
    error,
    connect,
    disconnect,
    reconnect,
    executeCommand,
    connectionInfo
  };
}
