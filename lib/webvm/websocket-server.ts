/**
 * WebSocket Server for WebVM Communication
 * Handles real-time communication between browser and WebVM containers
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { verify } from 'jsonwebtoken';
import { getContainerManager, ContainerInfo } from './container-manager';
import { db } from '@/lib/db';

export interface WebSocketMessage {
  type: 'terminal' | 'file' | 'system' | 'collaboration';
  action: string;
  data: any;
  requestId?: string;
}

export interface WebSocketResponse {
  type: 'terminal' | 'file' | 'system' | 'collaboration' | 'error';
  action: string;
  data: any;
  requestId?: string;
  success: boolean;
}

export interface ClientConnection {
  ws: WebSocket;
  userId: string;
  instanceId: string;
  workspaceId: string;
  container?: ContainerInfo;
  lastActivity: Date;
}

export class WebVMWebSocketServer {
  private wss: WebSocketServer;
  private connections = new Map<string, ClientConnection>();
  private instanceConnections = new Map<string, Set<string>>();

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ 
      port,
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log(`WebVM WebSocket server started on port ${port}`);
  }

  /**
   * Verify client connection with JWT token
   */
  private async verifyClient(info: { req: IncomingMessage }): Promise<boolean> {
    try {
      const url = parse(info.req.url || '', true);
      const token = url.query.token as string;
      const instanceId = url.query.instanceId as string;

      if (!token || !instanceId) {
        return false;
      }

      // Verify JWT token
      const decoded = verify(token, process.env.NEXTAUTH_SECRET!) as any;
      if (!decoded.sub) {
        return false;
      }

      // Check if user has access to the instance
      const instance = await db.webVMInstance.findUnique({
        where: { id: instanceId },
        include: {
          workspace: {
            include: {
              project: {
                include: {
                  organization: {
                    include: {
                      members: {
                        where: { userId: decoded.sub }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      return !!(instance && instance.workspace.project.organization.members.length > 0);
    } catch (error) {
      console.error('WebSocket verification failed:', error);
      return false;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
    try {
      const url = parse(req.url || '', true);
      const token = url.query.token as string;
      const instanceId = url.query.instanceId as string;

      // Decode token to get user info
      const decoded = verify(token, process.env.NEXTAUTH_SECRET!) as any;
      const userId = decoded.sub;

      // Get instance info
      const instance = await db.webVMInstance.findUnique({
        where: { id: instanceId },
        include: { workspace: true }
      });

      if (!instance) {
        ws.close(1008, 'Instance not found');
        return;
      }

      // Create connection info
      const connectionId = `${userId}_${instanceId}_${Date.now()}`;
      const connection: ClientConnection = {
        ws,
        userId,
        instanceId,
        workspaceId: instance.workspaceId,
        lastActivity: new Date()
      };

      // Get or create container
      const containerManager = getContainerManager();
      try {
        connection.container = await containerManager.getContainer(instanceId, userId);
      } catch (error) {
        ws.close(1011, `Failed to get container: ${error}`);
        return;
      }

      // Store connection
      this.connections.set(connectionId, connection);
      
      // Track instance connections
      if (!this.instanceConnections.has(instanceId)) {
        this.instanceConnections.set(instanceId, new Set());
      }
      this.instanceConnections.get(instanceId)!.add(connectionId);

      // Set up message handling
      ws.on('message', (data) => this.handleMessage(connectionId, data));
      ws.on('close', () => this.handleDisconnection(connectionId));
      ws.on('error', (error) => this.handleError(connectionId, error));

      // Send connection success
      this.sendMessage(ws, {
        type: 'system',
        action: 'connected',
        data: {
          instanceId,
          workspaceId: instance.workspaceId,
          connectionUrl: connection.container.connectionUrl
        },
        success: true
      });

      console.log(`WebSocket connected: ${connectionId}`);
    } catch (error) {
      console.error('Connection setup failed:', error);
      ws.close(1011, 'Connection setup failed');
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(connectionId: string, data: Buffer): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      connection.lastActivity = new Date();

      let response: WebSocketResponse;

      switch (message.type) {
        case 'terminal':
          response = await this.handleTerminalMessage(connection, message);
          break;
        case 'file':
          response = await this.handleFileMessage(connection, message);
          break;
        case 'system':
          response = await this.handleSystemMessage(connection, message);
          break;
        case 'collaboration':
          response = await this.handleCollaborationMessage(connection, message);
          break;
        default:
          response = {
            type: 'error',
            action: 'unknown_type',
            data: { error: 'Unknown message type' },
            requestId: message.requestId,
            success: false
          };
      }

      this.sendMessage(connection.ws, response);
    } catch (error) {
      console.error(`Message handling error for ${connectionId}:`, error);
      this.sendMessage(connection.ws, {
        type: 'error',
        action: 'message_error',
        data: { error: 'Failed to process message' },
        success: false
      });
    }
  }

  /**
   * Handle terminal messages
   */
  private async handleTerminalMessage(
    connection: ClientConnection, 
    message: WebSocketMessage
  ): Promise<WebSocketResponse> {
    if (!connection.container) {
      return {
        type: 'error',
        action: 'no_container',
        data: { error: 'No container available' },
        requestId: message.requestId,
        success: false
      };
    }

    switch (message.action) {
      case 'execute':
        const result = await connection.container.sandbox.executeCommand(
          message.data.command,
          message.data.options
        );
        return {
          type: 'terminal',
          action: 'output',
          data: result,
          requestId: message.requestId,
          success: result.success
        };

      case 'resize':
        // Handle terminal resize
        return {
          type: 'terminal',
          action: 'resized',
          data: { rows: message.data.rows, cols: message.data.cols },
          requestId: message.requestId,
          success: true
        };

      default:
        return {
          type: 'error',
          action: 'unknown_terminal_action',
          data: { error: 'Unknown terminal action' },
          requestId: message.requestId,
          success: false
        };
    }
  }

  /**
   * Handle file operation messages
   */
  private async handleFileMessage(
    connection: ClientConnection,
    message: WebSocketMessage
  ): Promise<WebSocketResponse> {
    if (!connection.container) {
      return {
        type: 'error',
        action: 'no_container',
        data: { error: 'No container available' },
        requestId: message.requestId,
        success: false
      };
    }

    switch (message.action) {
      case 'read':
        const content = await connection.container.sandbox.readFile(message.data.path);
        return {
          type: 'file',
          action: 'content',
          data: { path: message.data.path, content },
          requestId: message.requestId,
          success: true
        };

      case 'write':
        await connection.container.sandbox.writeFile(message.data.path, message.data.content);
        
        // Broadcast file change to other connections
        this.broadcastToInstance(connection.instanceId, {
          type: 'file',
          action: 'changed',
          data: { path: message.data.path, userId: connection.userId },
          success: true
        }, connection.userId);

        return {
          type: 'file',
          action: 'saved',
          data: { path: message.data.path },
          requestId: message.requestId,
          success: true
        };

      case 'list':
        const files = await connection.container.sandbox.listFiles(message.data.path);
        return {
          type: 'file',
          action: 'list',
          data: { path: message.data.path, files },
          requestId: message.requestId,
          success: true
        };

      default:
        return {
          type: 'error',
          action: 'unknown_file_action',
          data: { error: 'Unknown file action' },
          requestId: message.requestId,
          success: false
        };
    }
  }

  /**
   * Handle system messages
   */
  private async handleSystemMessage(
    connection: ClientConnection,
    message: WebSocketMessage
  ): Promise<WebSocketResponse> {
    switch (message.action) {
      case 'ping':
        return {
          type: 'system',
          action: 'pong',
          data: { timestamp: Date.now() },
          requestId: message.requestId,
          success: true
        };

      case 'status':
        return {
          type: 'system',
          action: 'status',
          data: {
            connected: true,
            instanceId: connection.instanceId,
            workspaceId: connection.workspaceId,
            containerStatus: connection.container?.status
          },
          requestId: message.requestId,
          success: true
        };

      default:
        return {
          type: 'error',
          action: 'unknown_system_action',
          data: { error: 'Unknown system action' },
          requestId: message.requestId,
          success: false
        };
    }
  }

  /**
   * Handle collaboration messages
   */
  private async handleCollaborationMessage(
    connection: ClientConnection,
    message: WebSocketMessage
  ): Promise<WebSocketResponse> {
    // Broadcast collaboration events to other users in the same instance
    this.broadcastToInstance(connection.instanceId, {
      type: 'collaboration',
      action: message.action,
      data: { ...message.data, userId: connection.userId },
      success: true
    }, connection.userId);

    return {
      type: 'collaboration',
      action: 'broadcasted',
      data: { action: message.action },
      requestId: message.requestId,
      success: true
    };
  }

  /**
   * Broadcast message to all connections for an instance
   */
  private broadcastToInstance(instanceId: string, message: WebSocketResponse, excludeUserId?: string): void {
    const connectionIds = this.instanceConnections.get(instanceId);
    if (!connectionIds) return;

    for (const connectionId of connectionIds) {
      const connection = this.connections.get(connectionId);
      if (connection && connection.userId !== excludeUserId) {
        this.sendMessage(connection.ws, message);
      }
    }
  }

  /**
   * Send message to WebSocket client
   */
  private sendMessage(ws: WebSocket, message: WebSocketResponse): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Remove from instance connections
      const instanceConnections = this.instanceConnections.get(connection.instanceId);
      if (instanceConnections) {
        instanceConnections.delete(connectionId);
        if (instanceConnections.size === 0) {
          this.instanceConnections.delete(connection.instanceId);
        }
      }

      // Remove connection
      this.connections.delete(connectionId);
      console.log(`WebSocket disconnected: ${connectionId}`);
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(connectionId: string, error: Error): void {
    console.error(`WebSocket error for ${connectionId}:`, error);
    this.handleDisconnection(connectionId);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.connections.size,
      activeInstances: this.instanceConnections.size,
      connectionsByInstance: Array.from(this.instanceConnections.entries()).map(([instanceId, connections]) => ({
        instanceId,
        connectionCount: connections.size
      }))
    };
  }

  /**
   * Shutdown the WebSocket server
   */
  shutdown(): void {
    this.wss.close();
    console.log('WebVM WebSocket server shutdown');
  }
}
