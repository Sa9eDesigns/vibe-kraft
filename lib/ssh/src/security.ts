/**
 * SSH Security utilities and validation
 */

import { SSHConnectionConfig, SSHAuthMethod, SSHHostKey } from './types';
import { createSSHError } from './errors';
import { isDangerousCommand, sanitizeCommandForLogging } from './utils';

/**
 * Security policy configuration
 */
export interface SSHSecurityPolicy {
  // Host verification
  requireHostKeyVerification?: boolean;
  allowUnknownHosts?: boolean;
  trustedHosts?: string[];
  
  // Command restrictions
  allowDangerousCommands?: boolean;
  blockedCommands?: string[];
  allowedCommands?: string[];
  
  // Connection restrictions
  maxConnectionTime?: number; // milliseconds
  maxIdleTime?: number; // milliseconds
  allowedPorts?: number[];
  
  // Authentication restrictions
  requireStrongPasswords?: boolean;
  minPasswordLength?: number;
  allowPasswordAuth?: boolean;
  allowKeyAuth?: boolean;
  allowAgentAuth?: boolean;
  
  // Rate limiting
  maxConnectionAttempts?: number;
  connectionAttemptWindow?: number; // milliseconds
}

/**
 * Default security policy
 */
export const DEFAULT_SECURITY_POLICY: Required<SSHSecurityPolicy> = {
  requireHostKeyVerification: true,
  allowUnknownHosts: false,
  trustedHosts: [],
  allowDangerousCommands: false,
  blockedCommands: [
    'rm -rf /',
    'dd if=/dev/zero',
    'mkfs',
    'fdisk',
    'parted',
    'shutdown',
    'reboot',
    'halt',
    'init 0',
    'init 6'
  ],
  allowedCommands: [],
  maxConnectionTime: 3600000, // 1 hour
  maxIdleTime: 1800000, // 30 minutes
  allowedPorts: [22, 2222],
  requireStrongPasswords: true,
  minPasswordLength: 8,
  allowPasswordAuth: true,
  allowKeyAuth: true,
  allowAgentAuth: true,
  maxConnectionAttempts: 5,
  connectionAttemptWindow: 300000 // 5 minutes
};

/**
 * Security validator class
 */
export class SSHSecurityValidator {
  private policy: Required<SSHSecurityPolicy>;
  private connectionAttempts = new Map<string, { count: number; firstAttempt: number }>();

  constructor(policy: SSHSecurityPolicy = {}) {
    this.policy = { ...DEFAULT_SECURITY_POLICY, ...policy };
  }

  /**
   * Validate connection configuration against security policy
   */
  validateConnection(config: SSHConnectionConfig): void {
    this.validateHost(config.host, config.port);
    this.validateAuth(config.auth);
    this.checkRateLimit(config.host);
  }

  /**
   * Validate host and port
   */
  private validateHost(host: string, port?: number): void {
    const actualPort = port || 22;
    
    // Check if port is allowed
    if (this.policy.allowedPorts.length > 0 && !this.policy.allowedPorts.includes(actualPort)) {
      throw createSSHError(
        `Port ${actualPort} is not allowed by security policy`,
        'PORT_NOT_ALLOWED'
      );
    }
    
    // Check if host is trusted (if trusted hosts are specified)
    if (this.policy.trustedHosts.length > 0 && !this.policy.trustedHosts.includes(host)) {
      throw createSSHError(
        `Host ${host} is not in the trusted hosts list`,
        'HOST_NOT_TRUSTED'
      );
    }
  }

  /**
   * Validate authentication method
   */
  private validateAuth(auth: SSHAuthMethod): void {
    switch (auth.type) {
      case 'password':
        if (!this.policy.allowPasswordAuth) {
          throw createSSHError(
            'Password authentication is disabled by security policy',
            'PASSWORD_AUTH_DISABLED'
          );
        }
        this.validatePassword(auth.password);
        break;
        
      case 'key':
        if (!this.policy.allowKeyAuth) {
          throw createSSHError(
            'Key authentication is disabled by security policy',
            'KEY_AUTH_DISABLED'
          );
        }
        this.validatePrivateKey(auth.privateKey);
        break;
        
      case 'agent':
        if (!this.policy.allowAgentAuth) {
          throw createSSHError(
            'Agent authentication is disabled by security policy',
            'AGENT_AUTH_DISABLED'
          );
        }
        break;
    }
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (this.policy.requireStrongPasswords) {
      if (password.length < this.policy.minPasswordLength) {
        throw createSSHError(
          `Password must be at least ${this.policy.minPasswordLength} characters long`,
          'PASSWORD_TOO_SHORT'
        );
      }
      
      // Check for common weak passwords
      const weakPasswords = ['password', '123456', 'admin', 'root', 'guest'];
      if (weakPasswords.includes(password.toLowerCase())) {
        throw createSSHError(
          'Password is too weak. Please use a stronger password.',
          'PASSWORD_TOO_WEAK'
        );
      }
      
      // Check for basic complexity
      const hasLower = /[a-z]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      const complexityScore = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
      
      if (complexityScore < 3) {
        throw createSSHError(
          'Password must contain at least 3 of: lowercase, uppercase, numbers, special characters',
          'PASSWORD_INSUFFICIENT_COMPLEXITY'
        );
      }
    }
  }

  /**
   * Validate private key
   */
  private validatePrivateKey(privateKey: string | Buffer): void {
    const keyString = typeof privateKey === 'string' ? privateKey : privateKey.toString();
    
    // Check if key appears to be encrypted
    if (keyString.includes('ENCRYPTED')) {
      // This is good - encrypted keys are more secure
      return;
    }
    
    // Check for common key headers
    const validHeaders = [
      '-----BEGIN RSA PRIVATE KEY-----',
      '-----BEGIN DSA PRIVATE KEY-----',
      '-----BEGIN EC PRIVATE KEY-----',
      '-----BEGIN OPENSSH PRIVATE KEY-----',
      '-----BEGIN PRIVATE KEY-----'
    ];
    
    const hasValidHeader = validHeaders.some(header => keyString.includes(header));
    
    if (!hasValidHeader) {
      throw createSSHError(
        'Private key format is not recognized',
        'INVALID_KEY_FORMAT'
      );
    }
  }

  /**
   * Check rate limiting for connection attempts
   */
  private checkRateLimit(host: string): void {
    const now = Date.now();
    const attempts = this.connectionAttempts.get(host);
    
    if (!attempts) {
      this.connectionAttempts.set(host, { count: 1, firstAttempt: now });
      return;
    }
    
    // Reset counter if window has passed
    if (now - attempts.firstAttempt > this.policy.connectionAttemptWindow) {
      this.connectionAttempts.set(host, { count: 1, firstAttempt: now });
      return;
    }
    
    // Check if limit exceeded
    if (attempts.count >= this.policy.maxConnectionAttempts) {
      throw createSSHError(
        `Too many connection attempts to ${host}. Please wait before trying again.`,
        'RATE_LIMIT_EXCEEDED'
      );
    }
    
    // Increment counter
    attempts.count++;
  }

  /**
   * Validate command before execution
   */
  validateCommand(command: string): void {
    const sanitizedCommand = sanitizeCommandForLogging(command);
    
    // Check if command is explicitly blocked
    if (this.policy.blockedCommands.some(blocked => command.toLowerCase().includes(blocked.toLowerCase()))) {
      throw createSSHError(
        `Command is blocked by security policy: ${sanitizedCommand}`,
        'COMMAND_BLOCKED'
      );
    }
    
    // Check if only specific commands are allowed
    if (this.policy.allowedCommands.length > 0) {
      const isAllowed = this.policy.allowedCommands.some(allowed => 
        command.toLowerCase().startsWith(allowed.toLowerCase())
      );
      
      if (!isAllowed) {
        throw createSSHError(
          `Command is not in allowed commands list: ${sanitizedCommand}`,
          'COMMAND_NOT_ALLOWED'
        );
      }
    }
    
    // Check for dangerous commands
    if (!this.policy.allowDangerousCommands && isDangerousCommand(command)) {
      throw createSSHError(
        `Potentially dangerous command detected: ${sanitizedCommand}`,
        'DANGEROUS_COMMAND'
      );
    }
  }

  /**
   * Validate host key
   */
  validateHostKey(host: string, port: number, hostKey: SSHHostKey, knownHosts: SSHHostKey[]): void {
    if (!this.policy.requireHostKeyVerification) {
      return;
    }
    
    const hostIdentifier = port === 22 ? host : `[${host}]:${port}`;
    
    // Find matching known host
    const knownHost = knownHosts.find(kh => 
      kh.fingerprint === hostKey.fingerprint && kh.type === hostKey.type
    );
    
    if (!knownHost) {
      if (!this.policy.allowUnknownHosts) {
        throw createSSHError(
          `Host key verification failed for ${hostIdentifier}. Host key not found in known hosts.`,
          'HOST_KEY_UNKNOWN'
        );
      }
    }
  }

  /**
   * Check connection time limits
   */
  checkConnectionTime(connectionStart: Date): void {
    const now = new Date();
    const connectionTime = now.getTime() - connectionStart.getTime();
    
    if (connectionTime > this.policy.maxConnectionTime) {
      throw createSSHError(
        'Connection time limit exceeded',
        'CONNECTION_TIME_LIMIT'
      );
    }
  }

  /**
   * Check idle time limits
   */
  checkIdleTime(lastActivity: Date): void {
    const now = new Date();
    const idleTime = now.getTime() - lastActivity.getTime();
    
    if (idleTime > this.policy.maxIdleTime) {
      throw createSSHError(
        'Connection idle time limit exceeded',
        'IDLE_TIME_LIMIT'
      );
    }
  }

  /**
   * Clean up old rate limit entries
   */
  cleanupRateLimitEntries(): void {
    const now = Date.now();
    
    for (const [host, attempts] of this.connectionAttempts.entries()) {
      if (now - attempts.firstAttempt > this.policy.connectionAttemptWindow) {
        this.connectionAttempts.delete(host);
      }
    }
  }

  /**
   * Update security policy
   */
  updatePolicy(newPolicy: Partial<SSHSecurityPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };
  }

  /**
   * Get current security policy
   */
  getPolicy(): Required<SSHSecurityPolicy> {
    return { ...this.policy };
  }
}
