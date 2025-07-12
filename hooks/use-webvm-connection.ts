/**
 * React hook for managing WebVM WebSocket connections
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage, WebSocketResponse } from '@/lib/webvm/websocket-server';

export interface WebVMConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  instanceId: string | null;
  workspaceId: string | null;
}

export interface WebVMConnectionOptions {
  instanceId: string;
  onTerminalOutput?: (output: string) => void;
  onFileChange?: (path: string, content: string) => void;
  onCollaboration?: (event: any) => void;
  onError?: (error: string) => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export function useWebVMConnection(options: WebVMConnectionOptions) {
  const [state, setState] = useState<WebVMConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    instanceId: null,
    workspaceId: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pendingRequestsRef = useRef(new Map<string, (response: WebSocketResponse) => void>());

  const {
    instanceId,
    onTerminalOutput,
    onFileChange,
    onCollaboration,
    onError,
    reconnectAttempts = 5,
    reconnectDelay = 3000
  } = options;

  /**
   * Generate unique request ID
   */
  const generateRequestId = useCallback(() => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Send message and wait for response
   */
  const sendMessage = useCallback(async (message: Omit<WebSocketMessage, 'requestId'>): Promise<WebSocketResponse> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const requestId = generateRequestId();
      const messageWithId: WebSocketMessage = { ...message, requestId };

      // Store pending request
      pendingRequestsRef.current.set(requestId, resolve);

      // Set timeout for request
      setTimeout(() => {
        if (pendingRequestsRef.current.has(requestId)) {
          pendingRequestsRef.current.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000); // 30 second timeout

      wsRef.current.send(JSON.stringify(messageWithId));
    });
  }, [generateRequestId]);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(async () => {
    if (state.connecting || state.connected) return;

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      // Get WebSocket connection details from API
      const response = await fetch(`/api/webvm-instances/${instanceId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to get connection details: ${response.statusText}`);
      }

      const { wsUrl, workspaceId } = await response.json();

      // Create WebSocket connection
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
          instanceId,
          workspaceId
        }));
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const response: WebSocketResponse = JSON.parse(event.data);

          // Handle pending requests
          if (response.requestId && pendingRequestsRef.current.has(response.requestId)) {
            const resolver = pendingRequestsRef.current.get(response.requestId)!;
            pendingRequestsRef.current.delete(response.requestId);
            resolver(response);
            return;
          }

          // Handle real-time events
          switch (response.type) {
            case 'terminal':
              if (response.action === 'output' && onTerminalOutput) {
                onTerminalOutput(response.data.output);
              }
              break;

            case 'file':
              if (response.action === 'changed' && onFileChange) {
                onFileChange(response.data.path, response.data.content);
              }
              break;

            case 'collaboration':
              if (onCollaboration) {
                onCollaboration(response.data);
              }
              break;

            case 'error':
              if (onError) {
                onError(response.data.error);
              }
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false
        }));

        // Attempt reconnection if not manually closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };

      ws.onerror = (error) => {
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: 'WebSocket connection error'
        }));
        
        if (onError) {
          onError('WebSocket connection error');
        }
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
      
      if (onError) {
        onError(error instanceof Error ? error.message : 'Connection failed');
      }
    }
  }, [instanceId, onTerminalOutput, onFileChange, onCollaboration, onError, reconnectAttempts, reconnectDelay, state.connecting, state.connected]);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      instanceId: null,
      workspaceId: null
    }));
  }, []);

  /**
   * Execute terminal command
   */
  const executeCommand = useCallback(async (command: string, options?: any): Promise<any> => {
    const response = await sendMessage({
      type: 'terminal',
      action: 'execute',
      data: { command, options }
    });
    return response.data;
  }, [sendMessage]);

  /**
   * Read file content
   */
  const readFile = useCallback(async (path: string): Promise<string> => {
    const response = await sendMessage({
      type: 'file',
      action: 'read',
      data: { path }
    });
    return response.data.content;
  }, [sendMessage]);

  /**
   * Write file content
   */
  const writeFile = useCallback(async (path: string, content: string): Promise<void> => {
    await sendMessage({
      type: 'file',
      action: 'write',
      data: { path, content }
    });
  }, [sendMessage]);

  /**
   * List files in directory
   */
  const listFiles = useCallback(async (path: string): Promise<any[]> => {
    const response = await sendMessage({
      type: 'file',
      action: 'list',
      data: { path }
    });
    return response.data.files;
  }, [sendMessage]);

  /**
   * Send collaboration event
   */
  const sendCollaborationEvent = useCallback(async (action: string, data: any): Promise<void> => {
    await sendMessage({
      type: 'collaboration',
      action,
      data
    });
  }, [sendMessage]);

  /**
   * Ping server
   */
  const ping = useCallback(async (): Promise<number> => {
    const start = Date.now();
    await sendMessage({
      type: 'system',
      action: 'ping',
      data: {}
    });
    return Date.now() - start;
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [instanceId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    executeCommand,
    readFile,
    writeFile,
    listFiles,
    sendCollaborationEvent,
    ping
  };
}
