/**
 * SSH Library - Main exports
 */

// Core classes
export { SSHClient } from './client';
export { SSHTerminal } from './terminal';
export { SSHConnectionManager } from './connection-manager';

// React hooks
export { useSSHConnection } from './hooks/use-ssh-connection';
export { useSSHTerminal } from './hooks/use-ssh-terminal';

// Types
export type {
  SSHConnectionConfig,
  SSHAuthMethod,
  SSHPasswordAuth,
  SSHKeyAuth,
  SSHAgentAuth,
  SSHConnectionState,
  SSHTerminalConfig,
  SSHCommandOptions,
  SSHCommandResult,
  SSHStreamEvents,
  SSHConnectionEvents,
  SSHTerminalIntegration,
  SSHConnectionPoolConfig,
  SSHConnectionPoolStats,
  SSHReconnectionConfig,
  SSHHostKey,
  SSHKnownHost,
  SSHFileTransferOptions,
  SSHFileInfo,
  SSHEventListener,
  SSHEventMap,
  SSHConfigValidationResult,
  SSHLibraryOptions
} from './types';

// Error classes
export {
  SSHError,
  SSHConnectionError,
  SSHAuthenticationError,
  SSHTimeoutError,
  SSHCommandError
} from './types';

// Error utilities
export {
  createSSHError,
  isRecoverableError,
  isAuthenticationError,
  isConnectionError,
  getUserFriendlyErrorMessage,
  getErrorRecoverySuggestions,
  logSSHError,
  SSH_ERROR_CODES
} from './errors';

// Validation utilities
export {
  validateSSHConfig,
  validateAuthMethod,
  validateTerminalConfig,
  validateCommandOptions,
  sanitizeConfigForLogging
} from './validation';

// Security utilities
export {
  SSHSecurityValidator,
  DEFAULT_SECURITY_POLICY
} from './security';

export type {
  SSHSecurityPolicy
} from './security';

// Utility functions
export {
  parseSSHConnectionString,
  generateKeyFingerprint,
  validateHostKey,
  formatConnectionDuration,
  escapeShellArg,
  buildShellCommand,
  parseCommandOutput,
  isDangerousCommand,
  sanitizeCommandForLogging,
  generateSessionId,
  isValidPort,
  isLocalhost,
  getDefaultSSHPort,
  formatBytes,
  debounce,
  createRetryFunction
} from './utils';

// Terminal options and events
export type {
  SSHTerminalOptions,
  SSHTerminalEvents
} from './terminal';

// Hook options and returns
export type {
  UseSSHConnectionOptions,
  UseSSHConnectionReturn
} from './hooks/use-ssh-connection';

export type {
  UseSSHTerminalOptions,
  UseSSHTerminalReturn
} from './hooks/use-ssh-terminal';

// Connection manager options
export type {
  ConnectionManagerOptions
} from './connection-manager';

// Re-export ssh2 types that might be useful
export type { ConnectConfig, ClientChannel } from 'ssh2';
