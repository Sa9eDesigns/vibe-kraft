/**
 * Authentication Permissions
 * Role-based access control for infrastructure features
 */

import { UserRole } from '@/lib/generated/prisma';

// Permission definitions
export const PERMISSIONS = {
  // Infrastructure permissions
  INFRASTRUCTURE_READ: 'infrastructure:read',
  INFRASTRUCTURE_WRITE: 'infrastructure:write',
  INFRASTRUCTURE_DELETE: 'infrastructure:delete',
  
  // Storage permissions
  STORAGE_READ: 'storage:read',
  STORAGE_WRITE: 'storage:write',
  STORAGE_DELETE: 'storage:delete',
  STORAGE_ADMIN: 'storage:admin',
  
  // Container permissions
  CONTAINER_READ: 'container:read',
  CONTAINER_WRITE: 'container:write',
  CONTAINER_DELETE: 'container:delete',
  CONTAINER_ADMIN: 'container:admin',
  
  // WebVM permissions
  WEBVM_READ: 'webvm:read',
  WEBVM_WRITE: 'webvm:write',
  WEBVM_DELETE: 'webvm:delete',
  WEBVM_ADMIN: 'webvm:admin',
  
  // Metrics permissions
  METRICS_READ: 'metrics:read',
  METRICS_WRITE: 'metrics:write',
  METRICS_ADMIN: 'metrics:admin',
  
  // System permissions
  SYSTEM_ADMIN: 'system:admin',
  USER_MANAGEMENT: 'user:management',
  AUDIT_LOGS: 'audit:logs',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: [
    PERMISSIONS.STORAGE_READ,
    PERMISSIONS.WEBVM_READ,
    PERMISSIONS.WEBVM_WRITE,
    PERMISSIONS.METRICS_READ,
  ],
  ADMIN: [
    // All USER permissions
    ...ROLE_PERMISSIONS.USER || [],
    
    // Additional ADMIN permissions
    PERMISSIONS.INFRASTRUCTURE_READ,
    PERMISSIONS.INFRASTRUCTURE_WRITE,
    PERMISSIONS.STORAGE_WRITE,
    PERMISSIONS.STORAGE_DELETE,
    PERMISSIONS.CONTAINER_READ,
    PERMISSIONS.CONTAINER_WRITE,
    PERMISSIONS.CONTAINER_DELETE,
    PERMISSIONS.WEBVM_DELETE,
    PERMISSIONS.WEBVM_ADMIN,
    PERMISSIONS.METRICS_WRITE,
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.AUDIT_LOGS,
  ],
  SUPER_ADMIN: [
    // All ADMIN permissions
    ...ROLE_PERMISSIONS.ADMIN || [],
    
    // Additional SUPER_ADMIN permissions
    PERMISSIONS.INFRASTRUCTURE_DELETE,
    PERMISSIONS.STORAGE_ADMIN,
    PERMISSIONS.CONTAINER_ADMIN,
    PERMISSIONS.METRICS_ADMIN,
    PERMISSIONS.SYSTEM_ADMIN,
  ],
};

// Fix circular dependency by defining USER permissions after ADMIN
ROLE_PERMISSIONS.USER = [
  PERMISSIONS.STORAGE_READ,
  PERMISSIONS.WEBVM_READ,
  PERMISSIONS.WEBVM_WRITE,
  PERMISSIONS.METRICS_READ,
];

ROLE_PERMISSIONS.ADMIN = [
  ...ROLE_PERMISSIONS.USER,
  PERMISSIONS.INFRASTRUCTURE_READ,
  PERMISSIONS.INFRASTRUCTURE_WRITE,
  PERMISSIONS.STORAGE_WRITE,
  PERMISSIONS.STORAGE_DELETE,
  PERMISSIONS.CONTAINER_READ,
  PERMISSIONS.CONTAINER_WRITE,
  PERMISSIONS.CONTAINER_DELETE,
  PERMISSIONS.WEBVM_DELETE,
  PERMISSIONS.WEBVM_ADMIN,
  PERMISSIONS.METRICS_WRITE,
  PERMISSIONS.USER_MANAGEMENT,
  PERMISSIONS.AUDIT_LOGS,
];

ROLE_PERMISSIONS.SUPER_ADMIN = [
  ...ROLE_PERMISSIONS.ADMIN,
  PERMISSIONS.INFRASTRUCTURE_DELETE,
  PERMISSIONS.STORAGE_ADMIN,
  PERMISSIONS.CONTAINER_ADMIN,
  PERMISSIONS.METRICS_ADMIN,
  PERMISSIONS.SYSTEM_ADMIN,
];

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a user role
 */
export function getUserPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check if a user can access infrastructure features
 */
export function canAccessInfrastructure(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.INFRASTRUCTURE_READ);
}

/**
 * Check if a user can manage containers
 */
export function canManageContainers(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.CONTAINER_WRITE);
}

/**
 * Check if a user can manage storage
 */
export function canManageStorage(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.STORAGE_WRITE);
}

/**
 * Check if a user can manage WebVM instances
 */
export function canManageWebVM(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.WEBVM_WRITE);
}

/**
 * Check if a user can view metrics
 */
export function canViewMetrics(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.METRICS_READ);
}

/**
 * Check if a user can manage metrics
 */
export function canManageMetrics(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.METRICS_WRITE);
}

/**
 * Check if a user is a system administrator
 */
export function isSystemAdmin(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.SYSTEM_ADMIN);
}

/**
 * Resource-specific permission checks
 */
export const ResourcePermissions = {
  /**
   * Check if user can perform action on storage resource
   */
  storage: {
    canRead: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.STORAGE_READ),
    canWrite: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.STORAGE_WRITE),
    canDelete: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.STORAGE_DELETE),
    canAdmin: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.STORAGE_ADMIN),
  },

  /**
   * Check if user can perform action on container resource
   */
  container: {
    canRead: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.CONTAINER_READ),
    canWrite: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.CONTAINER_WRITE),
    canDelete: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.CONTAINER_DELETE),
    canAdmin: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.CONTAINER_ADMIN),
  },

  /**
   * Check if user can perform action on WebVM resource
   */
  webvm: {
    canRead: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.WEBVM_READ),
    canWrite: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.WEBVM_WRITE),
    canDelete: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.WEBVM_DELETE),
    canAdmin: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.WEBVM_ADMIN),
  },

  /**
   * Check if user can perform action on metrics resource
   */
  metrics: {
    canRead: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.METRICS_READ),
    canWrite: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.METRICS_WRITE),
    canAdmin: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.METRICS_ADMIN),
  },

  /**
   * Check if user can perform infrastructure actions
   */
  infrastructure: {
    canRead: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.INFRASTRUCTURE_READ),
    canWrite: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.INFRASTRUCTURE_WRITE),
    canDelete: (userRole: UserRole) => hasPermission(userRole, PERMISSIONS.INFRASTRUCTURE_DELETE),
  },
};

/**
 * Permission middleware for API routes
 */
export function requirePermission(permission: Permission) {
  return (userRole: UserRole) => {
    if (!hasPermission(userRole, permission)) {
      throw new Error(`Insufficient permissions. Required: ${permission}`);
    }
  };
}

/**
 * Permission middleware for multiple permissions (any)
 */
export function requireAnyPermission(permissions: Permission[]) {
  return (userRole: UserRole) => {
    if (!hasAnyPermission(userRole, permissions)) {
      throw new Error(`Insufficient permissions. Required any of: ${permissions.join(', ')}`);
    }
  };
}

/**
 * Permission middleware for multiple permissions (all)
 */
export function requireAllPermissions(permissions: Permission[]) {
  return (userRole: UserRole) => {
    if (!hasAllPermissions(userRole, permissions)) {
      throw new Error(`Insufficient permissions. Required all of: ${permissions.join(', ')}`);
    }
  };
}
