/**
 * Core types for SSH library
 */

import type { ConnectConfig } from 'ssh2';
import type { Terminal } from '@xterm/xterm';

// Authentication Types
export interface SSHPasswordAuth {
  type: 'password';
  username: string;
  password: string;
}

export interface SSHKeyAuth {
  type: 'key';
  username: string;
  privateKey: string | Buffer;
  passphrase?: string;
}

export interface SSHAgentAuth {
  type: 'agent';
  username: string;
  agent?: string;
}

export type SSHAuthMethod = SSHPasswordAuth | SSHKeyAuth | SSHAgentAuth;

// Connection Configuration
export interface SSHConnectionConfig {
  host: string;
  port?: number;
  auth: SSHAuthMethod;
  timeout?: number;
  keepaliveInterval?: number;
  keepaliveCountMax?: number;
  readyTimeout?: number;
  algorithms?: ConnectConfig['algorithms'];
  hostVerifier?: (keyHash: string, callback: (valid: boolean) => void) => void;
  debug?: (message: string) => void;
}

// Connection State
export type SSHConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'authenticating'
  | 'ready'
  | 'error'
  | 'closed';

// Terminal Configuration
export interface SSHTerminalConfig {
  rows?: number;
  cols?: number;
  term?: string;
  env?: Record<string, string>;
  pty?: boolean;
  x11?: boolean;
}

// Command Execution
export interface SSHCommandOptions {
  timeout?: number;
  env?: Record<string, string>;
  pty?: boolean;
  x11?: boolean;
}

export interface SSHCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal?: string;
  success: boolean;
  duration: number;
}

// Stream Events
export interface SSHStreamEvents {
  data: (chunk: Buffer) => void;
  error: (error: Error) => void;
  close: (code?: number, signal?: string) => void;
  end: () => void;
}

// Connection Events
export interface SSHConnectionEvents {
  connect: () => void;
  ready: () => void;
  error: (error: Error) => void;
  close: () => void;
  end: () => void;
  timeout: () => void;
  keyboard: (name: string, ctrl: boolean, meta: boolean, shift: boolean, cmd: boolean) => void;
}

// Error Types
export class SSHError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SSHError';
  }
}

export class SSHConnectionError extends SSHError {
  constructor(message: string, details?: any) {
    super(message, 'CONNECTION_ERROR', details);
    this.name = 'SSHConnectionError';
  }
}

export class SSHAuthenticationError extends SSHError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'SSHAuthenticationError';
  }
}

export class SSHTimeoutError extends SSHError {
  constructor(message: string, details?: any) {
    super(message, 'TIMEOUT_ERROR', details);
    this.name = 'SSHTimeoutError';
  }
}

export class SSHCommandError extends SSHError {
  constructor(message: string, public exitCode: number, details?: any) {
    super(message, 'COMMAND_ERROR', details);
    this.name = 'SSHCommandError';
  }
}

// Terminal Integration Types
export interface SSHTerminalIntegration {
  terminal: Terminal;
  onData?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
  onKey?: (key: string, event: KeyboardEvent) => void;
  theme?: 'light' | 'dark' | 'auto';
}

// Connection Pool Types
export interface SSHConnectionPoolConfig {
  maxConnections?: number;
  idleTimeout?: number;
  acquireTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface SSHConnectionPoolStats {
  total: number;
  active: number;
  idle: number;
  pending: number;
}

// Reconnection Configuration
export interface SSHReconnectionConfig {
  enabled?: boolean;
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
}

// Host Key Verification
export interface SSHHostKey {
  type: string;
  key: string;
  fingerprint: string;
}

export interface SSHKnownHost {
  host: string;
  port?: number;
  hostKey: SSHHostKey;
}

// File Transfer Types (for future SFTP support)
export interface SSHFileTransferOptions {
  preserveTimestamps?: boolean;
  mode?: number;
  overwrite?: boolean;
  createDirectories?: boolean;
}

export interface SSHFileInfo {
  name: string;
  path: string;
  size: number;
  mode: number;
  uid: number;
  gid: number;
  atime: Date;
  mtime: Date;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
}

// Utility Types
export type SSHEventListener<T = any> = (data: T) => void;
export type SSHEventMap = Record<string, SSHEventListener[]>;

// Configuration Validation
export interface SSHConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Library Options
export interface SSHLibraryOptions {
  debug?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  defaultTimeout?: number;
  defaultKeepAlive?: number;
  maxConcurrentConnections?: number;
}
