/**
 * SSH Client implementation using ssh2
 */

import { Client, ConnectConfig, ClientChannel } from 'ssh2';
import { EventEmitter } from 'events';
import {
  SSHConnectionConfig,
  SSHConnectionState,
  SSHCommandOptions,
  SSHCommandResult,
  SSHTerminalConfig
} from './types';
import { createSSHError, isRecoverableError, logSSHError } from './errors';
import { validateSSHConfig, sanitizeConfigForLogging } from './validation';

export interface SSHClientOptions {
  debug?: boolean;
  logger?: (level: string, message: string) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export class SSHClient extends EventEmitter {
  private client: Client;
  private config: SSHConnectionConfig;
  private options: SSHClientOptions;
  private state: SSHConnectionState = 'disconnected';
  private connectPromise: Promise<void> | null = null;
  private retryCount = 0;
  private activeChannels = new Set<ClientChannel>();

  constructor(config: SSHConnectionConfig, options: SSHClientOptions = {}) {
    super();
    
    // Validate configuration
    const validation = validateSSHConfig(config);
    if (!validation.valid) {
      throw createSSHError(`Invalid SSH configuration: ${validation.errors.join(', ')}`);
    }

    this.config = config;
    this.options = {
      debug: false,
      maxRetries: 3,
      retryDelay: 1000,
      ...options
    };

    this.client = new Client();
    this.setupEventHandlers();

    if (this.options.debug) {
      this.log('debug', `SSH Client created for ${this.config.host}:${this.config.port || 22}`);
      this.log('debug', `Config: ${JSON.stringify(sanitizeConfigForLogging(this.config), null, 2)}`);
    }
  }

  /**
   * Get current connection state
   */
  get connectionState(): SSHConnectionState {
    return this.state;
  }

  /**
   * Check if client is connected and ready
   */
  get isReady(): boolean {
    return this.state === 'ready';
  }

  /**
   * Check if client is connected (any connected state)
   */
  get isConnected(): boolean {
    return ['connected', 'authenticating', 'ready'].includes(this.state);
  }

  /**
   * Connect to SSH server
   */
  async connect(): Promise<void> {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    if (this.isConnected) {
      return Promise.resolve();
    }

    this.connectPromise = this.performConnect();
    
    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  /**
   * Disconnect from SSH server
   */
  async disconnect(): Promise<void> {
    if (this.state === 'disconnected') {
      return;
    }

    this.log('debug', 'Disconnecting SSH client');
    this.setState('disconnected');

    // Close all active channels
    for (const channel of this.activeChannels) {
      try {
        channel.close();
      } catch (error) {
        this.log('warn', `Error closing channel: ${error}`);
      }
    }
    this.activeChannels.clear();

    // End the connection
    this.client.end();
    
    // Wait a bit for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Execute a command on the remote server
   */
  async executeCommand(command: string, options: SSHCommandOptions = {}): Promise<SSHCommandResult> {
    if (!this.isReady) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let exitCode: number | null = null;
      let signal: string | undefined;

      const timeout = options.timeout || 30000; // 30 seconds default
      const timeoutId = setTimeout(() => {
        reject(createSSHError(`Command execution timed out after ${timeout}ms`, 'COMMAND_TIMEOUT'));
      }, timeout);

      this.client.exec(command, options, (err, stream) => {
        if (err) {
          clearTimeout(timeoutId);
          reject(createSSHError(`Command execution failed: ${err.message}`, 'COMMAND_ERROR', err));
          return;
        }

        this.activeChannels.add(stream);

        stream.on('close', (code: number, signalName: string) => {
          clearTimeout(timeoutId);
          this.activeChannels.delete(stream);
          
          exitCode = code;
          signal = signalName;
          
          const duration = Date.now() - startTime;
          const result: SSHCommandResult = {
            stdout,
            stderr,
            exitCode,
            signal,
            success: exitCode === 0,
            duration
          };

          this.log('debug', `Command executed: ${command} (exit code: ${exitCode}, duration: ${duration}ms)`);
          resolve(result);
        });

        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        stream.on('error', (error: Error) => {
          clearTimeout(timeoutId);
          this.activeChannels.delete(stream);
          reject(createSSHError(`Stream error: ${error.message}`, 'STREAM_ERROR', error));
        });
      });
    });
  }

  /**
   * Create a shell session
   */
  async createShell(terminalConfig: SSHTerminalConfig = {}): Promise<ClientChannel> {
    if (!this.isReady) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const shellOptions = {
        rows: terminalConfig.rows || 24,
        cols: terminalConfig.cols || 80,
        term: terminalConfig.term || 'xterm-256color',
        env: terminalConfig.env || {}
      };

      this.client.shell(shellOptions, (err, stream) => {
        if (err) {
          reject(createSSHError(`Shell creation failed: ${err.message}`, 'SHELL_ERROR', err));
          return;
        }

        this.activeChannels.add(stream);
        
        stream.on('close', () => {
          this.activeChannels.delete(stream);
        });

        this.log('debug', `Shell session created with options: ${JSON.stringify(shellOptions)}`);
        resolve(stream);
      });
    });
  }

  /**
   * Perform the actual connection
   */
  private async performConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setState('connecting');
      
      const connectConfig = this.buildConnectConfig();
      
      this.client.connect(connectConfig);

      // Set up one-time event handlers for this connection attempt
      const onReady = () => {
        this.setState('ready');
        this.retryCount = 0;
        this.log('debug', 'SSH connection ready');
        resolve();
      };

      const onError = async (error: Error) => {
        this.log('error', `SSH connection error: ${error.message}`);
        
        const sshError = createSSHError(`Connection error: ${error.message}`, 'CONNECTION_ERROR', error);
        
        if (this.retryCount < this.options.maxRetries! && isRecoverableError(sshError)) {
          this.retryCount++;
          this.log('info', `Retrying connection (attempt ${this.retryCount}/${this.options.maxRetries})`);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay! * this.retryCount));
          
          // Remove current listeners and try again
          this.client.removeListener('ready', onReady);
          this.client.removeListener('error', onError);
          
          try {
            await this.performConnect();
            resolve();
          } catch (retryError) {
            reject(retryError);
          }
        } else {
          this.setState('error');
          reject(sshError);
        }
      };

      this.client.once('ready', onReady);
      this.client.once('error', onError);
    });
  }

  /**
   * Build ssh2 connection configuration
   */
  private buildConnectConfig(): ConnectConfig {
    const config: any = {
      host: this.config.host,
      port: this.config.port || 22,
      username: this.config.auth.username,
      readyTimeout: this.config.readyTimeout || 20000,
      keepaliveInterval: this.config.keepaliveInterval || 30000,
      keepaliveCountMax: this.config.keepaliveCountMax || 3
    };

    if (this.options.debug) {
      config.debug = this.log.bind(this, 'debug');
    }

    if (this.config.algorithms) {
      config.algorithms = this.config.algorithms;
    }

    // Add authentication method
    switch (this.config.auth.type) {
      case 'password':
        config.password = this.config.auth.password;
        break;
      case 'key':
        config.privateKey = this.config.auth.privateKey;
        if (this.config.auth.passphrase) {
          config.passphrase = this.config.auth.passphrase;
        }
        break;
      case 'agent':
        const agentPath = this.config.auth.agent || process.env.SSH_AUTH_SOCK;
        if (agentPath) {
          config.agent = agentPath;
        }
        break;
    }

    return config;
  }

  /**
   * Set up event handlers for the SSH client
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.setState('connected');
      this.emit('connect');
    });

    this.client.on('ready', () => {
      this.setState('ready');
      this.emit('ready');
    });

    this.client.on('error', (error: Error) => {
      this.setState('error');
      const sshError = createSSHError(`Connection setup error: ${error.message}`, 'CONNECTION_ERROR', error);
      logSSHError(sshError, this.log.bind(this));
      this.emit('error', sshError);
    });

    this.client.on('close', () => {
      this.setState('closed');
      this.emit('close');
    });

    this.client.on('end', () => {
      this.setState('disconnected');
      this.emit('end');
    });

    this.client.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
      this.emit('keyboard', name, instructions, instructionsLang, prompts, finish);
    });
  }

  /**
   * Set connection state and emit event
   */
  private setState(newState: SSHConnectionState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.log('debug', `SSH state changed: ${oldState} -> ${newState}`);
      this.emit('stateChange', newState, oldState);
    }
  }

  /**
   * Log message with appropriate level
   */
  private log(level: string, message: string): void {
    if (this.options.logger) {
      this.options.logger(level, message);
    } else if (this.options.debug) {
      console.log(`[SSH ${level.toUpperCase()}] ${message}`);
    }
  }
}
