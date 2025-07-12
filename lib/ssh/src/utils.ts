/**
 * SSH utility functions
 */

import { SSHConnectionConfig, SSHHostKey } from './types';
import { createSSHError } from './errors';

/**
 * Parse SSH connection string (user@host:port)
 */
export function parseSSHConnectionString(connectionString: string): Partial<SSHConnectionConfig> {
  const regex = /^(?:([^@]+)@)?([^:]+)(?::(\d+))?$/;
  const match = connectionString.match(regex);
  
  if (!match) {
    throw createSSHError('Invalid SSH connection string format', 'INVALID_CONNECTION_STRING');
  }
  
  const [, username, host, portStr] = match;
  const port = portStr ? parseInt(portStr, 10) : undefined;
  
  const result: Partial<SSHConnectionConfig> = {};

  if (host) {
    result.host = host;
  }
  if (port) {
    result.port = port;
  }

  if (username) {
    result.auth = { username } as any;
  }

  return result;
}

/**
 * Generate SSH key fingerprint
 */
export function generateKeyFingerprint(publicKey: string, algorithm: 'md5' | 'sha256' = 'sha256'): string {
  // This is a simplified implementation
  // In a real implementation, you would use crypto libraries to generate proper fingerprints
  const crypto = require('crypto');
  
  try {
    const hash = crypto.createHash(algorithm === 'md5' ? 'md5' : 'sha256');
    hash.update(publicKey);
    const digest = hash.digest('hex');
    
    if (algorithm === 'md5') {
      // Format as MD5 fingerprint (xx:xx:xx:...)
      return digest.match(/.{2}/g)?.join(':') || digest;
    } else {
      // Format as SHA256 fingerprint
      return `SHA256:${Buffer.from(digest, 'hex').toString('base64').replace(/=+$/, '')}`;
    }
  } catch (error) {
    throw createSSHError(`Failed to generate key fingerprint: ${error}`, 'FINGERPRINT_ERROR');
  }
}

/**
 * Validate SSH host key against known hosts
 */
export function validateHostKey(
  host: string,
  port: number,
  hostKey: SSHHostKey,
  knownHosts: SSHHostKey[]
): { valid: boolean; reason?: string } {
  const hostIdentifier = port === 22 ? host : `[${host}]:${port}`;
  
  // Find matching host in known hosts
  const knownHost = knownHosts.find(kh => 
    kh.fingerprint === hostKey.fingerprint && kh.type === hostKey.type
  );
  
  if (!knownHost) {
    return {
      valid: false,
      reason: `Host key for ${hostIdentifier} is not in known hosts`
    };
  }
  
  return { valid: true };
}

/**
 * Format connection duration
 */
export function formatConnectionDuration(startTime: Date, endTime?: Date): string {
  const end = endTime || new Date();
  const duration = end.getTime() - startTime.getTime();
  
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Escape shell command arguments
 */
export function escapeShellArg(arg: string): string {
  // Simple shell escaping - wrap in single quotes and escape any single quotes
  return `'${arg.replace(/'/g, "'\"'\"'")}'`;
}

/**
 * Build shell command from command and arguments
 */
export function buildShellCommand(command: string, args: string[] = []): string {
  const escapedArgs = args.map(escapeShellArg);
  return [command, ...escapedArgs].join(' ');
}

/**
 * Parse command output for common patterns
 */
export function parseCommandOutput(output: string): {
  lines: string[];
  exitCode?: number;
  hasError: boolean;
  errorLines: string[];
} {
  const lines = output.split('\n').map(line => line.trim()).filter(Boolean);
  const errorLines = lines.filter(line => 
    line.toLowerCase().includes('error') ||
    line.toLowerCase().includes('failed') ||
    line.toLowerCase().includes('permission denied')
  );
  
  // Try to extract exit code from output
  const exitCodeMatch = output.match(/exit code[:\s]+(\d+)/i);
  let exitCode: number | undefined;
  if (exitCodeMatch && exitCodeMatch[1]) {
    exitCode = parseInt(exitCodeMatch[1], 10);
  }

  const result: {
    lines: string[];
    exitCode?: number;
    hasError: boolean;
    errorLines: string[];
  } = {
    lines,
    hasError: errorLines.length > 0 || (exitCode !== undefined && exitCode !== 0),
    errorLines
  };

  if (exitCode !== undefined) {
    result.exitCode = exitCode;
  }

  return result;
}

/**
 * Check if command is potentially dangerous
 */
export function isDangerousCommand(command: string): boolean {
  const dangerousCommands = [
    'rm -rf',
    'dd if=',
    'mkfs',
    'fdisk',
    'parted',
    'shutdown',
    'reboot',
    'halt',
    'init 0',
    'init 6',
    'systemctl poweroff',
    'systemctl reboot'
  ];
  
  const normalizedCommand = command.toLowerCase().trim();
  return dangerousCommands.some(dangerous => normalizedCommand.includes(dangerous));
}

/**
 * Sanitize command for logging
 */
export function sanitizeCommandForLogging(command: string): string {
  // Remove potential passwords or sensitive data from command
  return command
    .replace(/password[=\s]+\S+/gi, 'password=[REDACTED]')
    .replace(/passwd[=\s]+\S+/gi, 'passwd=[REDACTED]')
    .replace(/token[=\s]+\S+/gi, 'token=[REDACTED]')
    .replace(/key[=\s]+\S+/gi, 'key=[REDACTED]')
    .replace(/secret[=\s]+\S+/gi, 'secret=[REDACTED]');
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `ssh_${timestamp}_${random}`;
}

/**
 * Check if port is in valid range
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/**
 * Check if hostname is localhost
 */
export function isLocalhost(hostname: string): boolean {
  const localhostPatterns = [
    'localhost',
    '127.0.0.1',
    '::1',
    '0.0.0.0'
  ];
  
  return localhostPatterns.includes(hostname.toLowerCase());
}

/**
 * Get default SSH port
 */
export function getDefaultSSHPort(): number {
  return 22;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Debounce function for terminal resize events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Create retry function with exponential backoff
 */
export function createRetryFunction<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  backoffFactor: number = 2
): () => Promise<T> {
  return async () => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  };
}
