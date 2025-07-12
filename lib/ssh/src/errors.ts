/**
 * SSH Error handling utilities
 */

import { 
  SSHError, 
  SSHConnectionError, 
  SSHAuthenticationError, 
  SSHTimeoutError, 
  SSHCommandError 
} from './types';

// Error codes mapping
export const SSH_ERROR_CODES = {
  // Connection errors
  CONNECTION_REFUSED: 'ECONNREFUSED',
  CONNECTION_TIMEOUT: 'ETIMEDOUT',
  HOST_UNREACHABLE: 'EHOSTUNREACH',
  NETWORK_UNREACHABLE: 'ENETUNREACH',
  
  // Authentication errors
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_PARTIAL: 'AUTH_PARTIAL',
  AUTH_METHOD_NOT_SUPPORTED: 'AUTH_METHOD_NOT_SUPPORTED',
  
  // Protocol errors
  PROTOCOL_ERROR: 'PROTOCOL_ERROR',
  HANDSHAKE_FAILED: 'HANDSHAKE_FAILED',
  
  // Command errors
  COMMAND_FAILED: 'COMMAND_FAILED',
  COMMAND_TIMEOUT: 'COMMAND_TIMEOUT',
  
  // Stream errors
  STREAM_ERROR: 'STREAM_ERROR',
  STREAM_CLOSED: 'STREAM_CLOSED',
  
  // Configuration errors
  INVALID_CONFIG: 'INVALID_CONFIG',
  INVALID_HOST: 'INVALID_HOST',
  INVALID_PORT: 'INVALID_PORT',
  INVALID_AUTH: 'INVALID_AUTH',
  
  // Key errors
  INVALID_KEY: 'INVALID_KEY',
  KEY_NOT_FOUND: 'KEY_NOT_FOUND',
  KEY_PASSPHRASE_REQUIRED: 'KEY_PASSPHRASE_REQUIRED',
  
  // Host verification errors
  HOST_KEY_MISMATCH: 'HOST_KEY_MISMATCH',
  HOST_KEY_UNKNOWN: 'HOST_KEY_UNKNOWN',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_ABORTED: 'OPERATION_ABORTED'
} as const;

export type SSHErrorCode = typeof SSH_ERROR_CODES[keyof typeof SSH_ERROR_CODES];

/**
 * Create appropriate SSH error from raw error
 */
export function createSSHError(message: string, code?: string, details?: any): SSHError;
export function createSSHError(error: any, context?: string): SSHError;
export function createSSHError(errorOrMessage: any, contextOrCode?: string, details?: any): SSHError {
  // Handle overloaded function signatures
  if (typeof errorOrMessage === 'string') {
    // First signature: createSSHError(message, code, details)
    return new SSHError(errorOrMessage, contextOrCode || 'UNKNOWN_ERROR', details);
  }

  // Second signature: createSSHError(error, context)
  const error = errorOrMessage;
  const context = contextOrCode;
  const message = error?.message || 'Unknown SSH error';
  const code = error?.code || error?.errno || 'UNKNOWN_ERROR';
  
  // Connection-related errors
  if (code === 'ECONNREFUSED' || code === 'ECONNRESET' || code === 'ENOTFOUND') {
    return new SSHConnectionError(
      `Connection failed: ${message}${context ? ` (${context})` : ''}`,
      { originalError: error, code }
    );
  }
  
  // Timeout errors
  if (code === 'ETIMEDOUT' || message.includes('timeout')) {
    return new SSHTimeoutError(
      `Operation timed out: ${message}${context ? ` (${context})` : ''}`,
      { originalError: error, code }
    );
  }
  
  // Authentication errors
  if (code === 'AUTH_FAILED' || message.includes('authentication')) {
    return new SSHAuthenticationError(
      `Authentication failed: ${message}${context ? ` (${context})` : ''}`,
      { originalError: error, code }
    );
  }
  
  // Command execution errors
  if (error?.exitCode !== undefined) {
    return new SSHCommandError(
      `Command failed: ${message}${context ? ` (${context})` : ''}`,
      error.exitCode,
      { originalError: error, code }
    );
  }
  
  // Generic SSH error
  return new SSHError(
    `SSH error: ${message}${context ? ` (${context})` : ''}`,
    code,
    { originalError: error }
  );
}

/**
 * Check if error is recoverable (can retry)
 */
export function isRecoverableError(error: SSHError): boolean {
  const recoverableCodes: string[] = [
    SSH_ERROR_CODES.CONNECTION_TIMEOUT,
    SSH_ERROR_CODES.CONNECTION_REFUSED,
    SSH_ERROR_CODES.NETWORK_UNREACHABLE,
    SSH_ERROR_CODES.COMMAND_TIMEOUT
  ];

  return recoverableCodes.includes(error.code);
}

/**
 * Check if error is authentication-related
 */
export function isAuthenticationError(error: SSHError): boolean {
  return error instanceof SSHAuthenticationError ||
         error.code === SSH_ERROR_CODES.AUTH_FAILED ||
         error.code === SSH_ERROR_CODES.AUTH_PARTIAL ||
         error.code === SSH_ERROR_CODES.AUTH_METHOD_NOT_SUPPORTED;
}

/**
 * Check if error is connection-related
 */
export function isConnectionError(error: SSHError): boolean {
  return error instanceof SSHConnectionError ||
         error.code === SSH_ERROR_CODES.CONNECTION_REFUSED ||
         error.code === SSH_ERROR_CODES.CONNECTION_TIMEOUT ||
         error.code === SSH_ERROR_CODES.HOST_UNREACHABLE ||
         error.code === SSH_ERROR_CODES.NETWORK_UNREACHABLE;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: SSHError): string {
  switch (error.code) {
    case SSH_ERROR_CODES.CONNECTION_REFUSED:
      return 'Unable to connect to the server. Please check the host and port.';
    
    case SSH_ERROR_CODES.CONNECTION_TIMEOUT:
      return 'Connection timed out. The server may be unreachable or overloaded.';
    
    case SSH_ERROR_CODES.AUTH_FAILED:
      return 'Authentication failed. Please check your username and password/key.';
    
    case SSH_ERROR_CODES.HOST_UNREACHABLE:
      return 'Host is unreachable. Please check your network connection.';
    
    case SSH_ERROR_CODES.INVALID_KEY:
      return 'Invalid SSH key. Please check your private key format.';
    
    case SSH_ERROR_CODES.KEY_PASSPHRASE_REQUIRED:
      return 'SSH key requires a passphrase. Please provide the passphrase.';
    
    case SSH_ERROR_CODES.HOST_KEY_MISMATCH:
      return 'Host key verification failed. The server\'s identity has changed.';
    
    case SSH_ERROR_CODES.COMMAND_TIMEOUT:
      return 'Command execution timed out.';
    
    default:
      return error.message || 'An unknown error occurred.';
  }
}

/**
 * Error recovery suggestions
 */
export function getErrorRecoverySuggestions(error: SSHError): string[] {
  const suggestions: string[] = [];
  
  switch (error.code) {
    case SSH_ERROR_CODES.CONNECTION_REFUSED:
      suggestions.push('Verify the server is running and accessible');
      suggestions.push('Check if the SSH service is enabled on the server');
      suggestions.push('Verify the port number (default is 22)');
      break;
    
    case SSH_ERROR_CODES.CONNECTION_TIMEOUT:
      suggestions.push('Check your internet connection');
      suggestions.push('Try increasing the connection timeout');
      suggestions.push('Verify the server is not overloaded');
      break;
    
    case SSH_ERROR_CODES.AUTH_FAILED:
      suggestions.push('Double-check your username and password');
      suggestions.push('Verify SSH key permissions (600 for private key)');
      suggestions.push('Check if the user account is locked');
      break;
    
    case SSH_ERROR_CODES.HOST_KEY_MISMATCH:
      suggestions.push('Remove the old host key from known_hosts');
      suggestions.push('Verify the server identity before connecting');
      suggestions.push('Contact your system administrator');
      break;
    
    case SSH_ERROR_CODES.INVALID_KEY:
      suggestions.push('Check the SSH key format (OpenSSH, PEM, etc.)');
      suggestions.push('Verify the key file is not corrupted');
      suggestions.push('Ensure the key matches the expected algorithm');
      break;
    
    default:
      suggestions.push('Check the error details for more information');
      suggestions.push('Try reconnecting after a short delay');
      break;
  }
  
  return suggestions;
}

/**
 * Log error with appropriate level
 */
export function logSSHError(error: SSHError, logger?: (level: string, message: string) => void): void {
  const log = logger || console.error;
  
  if (isAuthenticationError(error)) {
    log('warn', `SSH Authentication Error: ${error.message}`);
  } else if (isConnectionError(error)) {
    log('error', `SSH Connection Error: ${error.message}`);
  } else if (error instanceof SSHTimeoutError) {
    log('warn', `SSH Timeout Error: ${error.message}`);
  } else {
    log('error', `SSH Error: ${error.message}`);
  }
  
  if (error.details) {
    log('debug', `Error details: ${JSON.stringify(error.details, null, 2)}`);
  }
}
