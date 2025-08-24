// src/lib/auth/permissions.js
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

export const PERMISSIONS = {
  // User permissions
  VIEW_OWN_PORTFOLIO: 'view_own_portfolio',
  CREATE_PORTFOLIO: 'create_portfolio',
  MANAGE_OWN_PORTFOLIO: 'manage_own_portfolio',
  MANAGE_OWN_ASSETS: 'manage_own_assets',
  
  // Admin permissions
  VIEW_ALL_PORTFOLIOS: 'view_all_portfolios',
  MANAGE_ALL_PORTFOLIOS: 'manage_all_portfolios',
  MANAGE_ALL_ASSETS: 'manage_all_assets',
  MANAGE_USERS: 'manage_users',
  VIEW_AUDIT_LOG: 'view_audit_log',
  SYSTEM_ADMIN: 'system_admin'
};

export const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    PERMISSIONS.VIEW_OWN_PORTFOLIO,
    PERMISSIONS.CREATE_PORTFOLIO,
    PERMISSIONS.MANAGE_OWN_PORTFOLIO,
    PERMISSIONS.MANAGE_OWN_ASSETS
  ],
  [ROLES.ADMIN]: [
    // Admin ha tutti i permessi
    ...Object.values(PERMISSIONS)
  ]
};

export function hasPermission(userRole, permission) {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

export function requirePermission(userRole, permission) {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Insufficient permissions. Required: ${permission}`);
  }
  return true;
}