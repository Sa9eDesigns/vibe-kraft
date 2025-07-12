/**
 * Infrastructure Authentication Utilities
 * Authentication helpers for infrastructure services and API routes
 */

import { auth } from '@/auth';
import { UserRole } from '@/lib/generated/prisma';
import { 
  hasPermission, 
  Permission, 
  PERMISSIONS,
  ResourcePermissions 
} from './permissions';
import { NextRequest } from 'next/server';

/**
 * Get current user session with infrastructure permissions
 */
export async function getInfrastructureSession() {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }

  const userRole = session.user.role as UserRole;
  const permissions = {
    canAccessInfrastructure: hasPermission(userRole, PERMISSIONS.INFRASTRUCTURE_READ),
    canManageInfrastructure: hasPermission(userRole, PERMISSIONS.INFRASTRUCTURE_WRITE),
    canDeleteInfrastructure: hasPermission(userRole, PERMISSIONS.INFRASTRUCTURE_DELETE),
    
    storage: ResourcePermissions.storage,
    container: ResourcePermissions.container,
    webvm: ResourcePermissions.webvm,
    metrics: ResourcePermissions.metrics,
    infrastructure: ResourcePermissions.infrastructure,
  };

  return {
    ...session,
    permissions,
    userRole,
  };
}

/**
 * Require authentication for API routes
 */
export async function requireAuth() {
  const session = await getInfrastructureSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  return session;
}

/**
 * Require specific permission for API routes
 */
export async function requireInfrastructurePermission(permission: Permission) {
  const session = await requireAuth();
  
  if (!hasPermission(session.userRole, permission)) {
    throw new Error(`Insufficient permissions. Required: ${permission}`);
  }

  return session;
}

/**
 * Check if user can access infrastructure features
 */
export async function requireInfrastructureAccess() {
  return requireInfrastructurePermission(PERMISSIONS.INFRASTRUCTURE_READ);
}

/**
 * Check if user can manage storage
 */
export async function requireStorageAccess(action: 'read' | 'write' | 'delete' | 'admin' = 'read') {
  const permissionMap = {
    read: PERMISSIONS.STORAGE_READ,
    write: PERMISSIONS.STORAGE_WRITE,
    delete: PERMISSIONS.STORAGE_DELETE,
    admin: PERMISSIONS.STORAGE_ADMIN,
  };

  return requireInfrastructurePermission(permissionMap[action]);
}

/**
 * Check if user can manage containers
 */
export async function requireContainerAccess(action: 'read' | 'write' | 'delete' | 'admin' = 'read') {
  const permissionMap = {
    read: PERMISSIONS.CONTAINER_READ,
    write: PERMISSIONS.CONTAINER_WRITE,
    delete: PERMISSIONS.CONTAINER_DELETE,
    admin: PERMISSIONS.CONTAINER_ADMIN,
  };

  return requireInfrastructurePermission(permissionMap[action]);
}

/**
 * Check if user can manage WebVM instances
 */
export async function requireWebVMAccess(action: 'read' | 'write' | 'delete' | 'admin' = 'read') {
  const permissionMap = {
    read: PERMISSIONS.WEBVM_READ,
    write: PERMISSIONS.WEBVM_WRITE,
    delete: PERMISSIONS.WEBVM_DELETE,
    admin: PERMISSIONS.WEBVM_ADMIN,
  };

  return requireInfrastructurePermission(permissionMap[action]);
}

/**
 * Check if user can access metrics
 */
export async function requireMetricsAccess(action: 'read' | 'write' | 'admin' = 'read') {
  const permissionMap = {
    read: PERMISSIONS.METRICS_READ,
    write: PERMISSIONS.METRICS_WRITE,
    admin: PERMISSIONS.METRICS_ADMIN,
  };

  return requireInfrastructurePermission(permissionMap[action]);
}

/**
 * Check if user is system administrator
 */
export async function requireSystemAdmin() {
  return requireInfrastructurePermission(PERMISSIONS.SYSTEM_ADMIN);
}

/**
 * Validate API key for infrastructure services
 */
export function validateInfrastructureApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-Admin-Key') || 
                 request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return false;
  }

  // In production, validate against stored API keys
  const validApiKeys = [
    process.env.ADMIN_API_KEY,
    process.env.INFRASTRUCTURE_JWT_SECRET,
  ].filter(Boolean);

  return validApiKeys.includes(apiKey);
}

/**
 * Generate infrastructure JWT token
 */
export function generateInfrastructureToken(payload: Record<string, any>): string {
  const jwt = require('jsonwebtoken');
  
  return jwt.sign(
    {
      ...payload,
      iss: 'vibekraft-infrastructure',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    },
    process.env.INFRASTRUCTURE_JWT_SECRET
  );
}

/**
 * Verify infrastructure JWT token
 */
export function verifyInfrastructureToken(token: string): any {
  const jwt = require('jsonwebtoken');
  
  try {
    return jwt.verify(token, process.env.INFRASTRUCTURE_JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid infrastructure token');
  }
}

/**
 * Create audit log entry for infrastructure actions
 */
export async function createInfrastructureAuditLog(
  action: string,
  resource: string,
  resourceId: string,
  details: Record<string, any> = {},
  request?: NextRequest
) {
  const session = await getInfrastructureSession();
  
  if (!session) {
    return;
  }

  const auditEntry = {
    userId: session.user.id,
    action,
    resource,
    resourceId,
    details,
    ipAddress: request?.ip || 'unknown',
    userAgent: request?.headers.get('user-agent') || 'unknown',
    timestamp: new Date(),
  };

  // In production, save to database
  console.log('Infrastructure Audit Log:', auditEntry);
  
  // TODO: Save to database
  // await db.auditLog.create({ data: auditEntry });
}

/**
 * Rate limiting for infrastructure operations
 */
export class InfrastructureRateLimit {
  private static limits = new Map<string, { count: number; resetTime: number }>();

  static async checkLimit(
    userId: string,
    operation: string,
    limit: number = 10,
    windowMs: number = 60000
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `${userId}:${operation}`;
    const now = Date.now();
    
    const current = this.limits.get(key);
    
    if (!current || now > current.resetTime) {
      const resetTime = now + windowMs;
      this.limits.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: limit - 1, resetTime };
    }
    
    if (current.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime };
    }
    
    current.count++;
    return { allowed: true, remaining: limit - current.count, resetTime: current.resetTime };
  }

  static async enforceLimit(
    userId: string,
    operation: string,
    limit?: number,
    windowMs?: number
  ): Promise<void> {
    const result = await this.checkLimit(userId, operation, limit, windowMs);
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
    }
  }
}

/**
 * Infrastructure session context for React components
 */
export interface InfrastructureSessionContext {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: UserRole;
  };
  permissions: {
    canAccessInfrastructure: boolean;
    canManageInfrastructure: boolean;
    canDeleteInfrastructure: boolean;
    storage: typeof ResourcePermissions.storage;
    container: typeof ResourcePermissions.container;
    webvm: typeof ResourcePermissions.webvm;
    metrics: typeof ResourcePermissions.metrics;
    infrastructure: typeof ResourcePermissions.infrastructure;
  };
  userRole: UserRole;
}

/**
 * Error classes for infrastructure authentication
 */
export class InfrastructureAuthError extends Error {
  constructor(message: string, public code: string = 'AUTH_ERROR') {
    super(message);
    this.name = 'InfrastructureAuthError';
  }
}

export class InsufficientPermissionsError extends InfrastructureAuthError {
  constructor(required: string) {
    super(`Insufficient permissions. Required: ${required}`, 'INSUFFICIENT_PERMISSIONS');
  }
}

export class RateLimitError extends InfrastructureAuthError {
  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter} seconds.`, 'RATE_LIMIT_EXCEEDED');
  }
}
