/**
 * SSH Configuration validation utilities
 */

import { 
  SSHConnectionConfig, 
  SSHAuthMethod, 
  SSHConfigValidationResult,
  SSHTerminalConfig,
  SSHCommandOptions
} from './types';

/**
 * Validate SSH connection configuration
 */
export function validateSSHConfig(config: SSHConnectionConfig): SSHConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate host
  if (!config.host || typeof config.host !== 'string') {
    errors.push('Host is required and must be a string');
  } else if (config.host.trim().length === 0) {
    errors.push('Host cannot be empty');
  } else if (!isValidHostname(config.host) && !isValidIPAddress(config.host)) {
    errors.push('Host must be a valid hostname or IP address');
  }

  // Validate port
  if (config.port !== undefined) {
    if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
      errors.push('Port must be an integer between 1 and 65535');
    }
  }

  // Validate authentication
  const authValidation = validateAuthMethod(config.auth);
  errors.push(...authValidation.errors);
  warnings.push(...authValidation.warnings);

  // Validate timeout values
  if (config.timeout !== undefined) {
    if (!Number.isInteger(config.timeout) || config.timeout < 0) {
      errors.push('Timeout must be a non-negative integer');
    } else if (config.timeout > 300000) { // 5 minutes
      warnings.push('Timeout is very high (>5 minutes), consider reducing it');
    }
  }

  if (config.readyTimeout !== undefined) {
    if (!Number.isInteger(config.readyTimeout) || config.readyTimeout < 0) {
      errors.push('Ready timeout must be a non-negative integer');
    }
  }

  if (config.keepaliveInterval !== undefined) {
    if (!Number.isInteger(config.keepaliveInterval) || config.keepaliveInterval < 0) {
      errors.push('Keepalive interval must be a non-negative integer');
    }
  }

  if (config.keepaliveCountMax !== undefined) {
    if (!Number.isInteger(config.keepaliveCountMax) || config.keepaliveCountMax < 0) {
      errors.push('Keepalive count max must be a non-negative integer');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate authentication method
 */
export function validateAuthMethod(auth: SSHAuthMethod): SSHConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!auth || typeof auth !== 'object') {
    errors.push('Authentication configuration is required');
    return { valid: false, errors, warnings };
  }

  // Validate username
  if (!auth.username || typeof auth.username !== 'string') {
    errors.push('Username is required and must be a string');
  } else if (auth.username.trim().length === 0) {
    errors.push('Username cannot be empty');
  } else if (auth.username.length > 32) {
    warnings.push('Username is unusually long (>32 characters)');
  }

  switch (auth.type) {
    case 'password':
      if (!auth.password || typeof auth.password !== 'string') {
        errors.push('Password is required for password authentication');
      } else if (auth.password.length === 0) {
        errors.push('Password cannot be empty');
      } else if (auth.password.length < 8) {
        warnings.push('Password is short (<8 characters), consider using a stronger password');
      }
      break;

    case 'key':
      if (!auth.privateKey) {
        errors.push('Private key is required for key authentication');
      } else if (typeof auth.privateKey === 'string') {
        if (auth.privateKey.trim().length === 0) {
          errors.push('Private key cannot be empty');
        } else if (!isValidSSHKey(auth.privateKey)) {
          errors.push('Private key format appears to be invalid');
        }
      } else if (!Buffer.isBuffer(auth.privateKey)) {
        errors.push('Private key must be a string or Buffer');
      }

      if (auth.passphrase !== undefined && typeof auth.passphrase !== 'string') {
        errors.push('Passphrase must be a string if provided');
      }
      break;

    case 'agent':
      if (auth.agent !== undefined && typeof auth.agent !== 'string') {
        errors.push('Agent path must be a string if provided');
      }
      break;

    default:
      errors.push('Authentication type must be "password", "key", or "agent"');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate terminal configuration
 */
export function validateTerminalConfig(config: SSHTerminalConfig): SSHConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config.rows !== undefined) {
    if (!Number.isInteger(config.rows) || config.rows < 1 || config.rows > 1000) {
      errors.push('Terminal rows must be an integer between 1 and 1000');
    }
  }

  if (config.cols !== undefined) {
    if (!Number.isInteger(config.cols) || config.cols < 1 || config.cols > 1000) {
      errors.push('Terminal columns must be an integer between 1 and 1000');
    }
  }

  if (config.term !== undefined) {
    if (typeof config.term !== 'string' || config.term.trim().length === 0) {
      errors.push('Terminal type must be a non-empty string');
    }
  }

  if (config.env !== undefined) {
    if (typeof config.env !== 'object' || config.env === null) {
      errors.push('Environment variables must be an object');
    } else {
      for (const [key, value] of Object.entries(config.env)) {
        if (typeof key !== 'string' || typeof value !== 'string') {
          errors.push('Environment variable keys and values must be strings');
          break;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate command options
 */
export function validateCommandOptions(options: SSHCommandOptions): SSHConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (options.timeout !== undefined) {
    if (!Number.isInteger(options.timeout) || options.timeout < 0) {
      errors.push('Command timeout must be a non-negative integer');
    } else if (options.timeout > 3600000) { // 1 hour
      warnings.push('Command timeout is very high (>1 hour)');
    }
  }

  if (options.env !== undefined) {
    if (typeof options.env !== 'object' || options.env === null) {
      errors.push('Environment variables must be an object');
    } else {
      for (const [key, value] of Object.entries(options.env)) {
        if (typeof key !== 'string' || typeof value !== 'string') {
          errors.push('Environment variable keys and values must be strings');
          break;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check if string is a valid hostname
 */
function isValidHostname(hostname: string): boolean {
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return hostnameRegex.test(hostname) && hostname.length <= 253;
}

/**
 * Check if string is a valid IP address (IPv4 or IPv6)
 */
function isValidIPAddress(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Basic SSH key format validation
 */
function isValidSSHKey(key: string): boolean {
  const trimmedKey = key.trim();
  
  // Check for common SSH key headers
  const sshKeyHeaders = [
    '-----BEGIN RSA PRIVATE KEY-----',
    '-----BEGIN DSA PRIVATE KEY-----',
    '-----BEGIN EC PRIVATE KEY-----',
    '-----BEGIN OPENSSH PRIVATE KEY-----',
    '-----BEGIN PRIVATE KEY-----',
    '-----BEGIN ENCRYPTED PRIVATE KEY-----'
  ];
  
  return sshKeyHeaders.some(header => trimmedKey.startsWith(header));
}

/**
 * Sanitize configuration for logging (remove sensitive data)
 */
export function sanitizeConfigForLogging(config: SSHConnectionConfig): Partial<SSHConnectionConfig> {
  const sanitized: any = {
    host: config.host,
    port: config.port,
    timeout: config.timeout,
    keepaliveInterval: config.keepaliveInterval,
    keepaliveCountMax: config.keepaliveCountMax,
    readyTimeout: config.readyTimeout,
    auth: {
      type: config.auth.type,
      username: config.auth.username
    }
  };

  // Don't include sensitive authentication data
  if (config.auth.type === 'password') {
    sanitized.auth.password = '[REDACTED]';
  } else if (config.auth.type === 'key') {
    sanitized.auth.privateKey = '[REDACTED]';
    if (config.auth.passphrase) {
      sanitized.auth.passphrase = '[REDACTED]';
    }
  }

  return sanitized;
}
