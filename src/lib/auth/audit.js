// src/lib/auth/audit.js
import db from '../db/index.js';
import { auditLog } from '../db/schema.js';

export async function createAuditLog({
  userId,
  action,
  targetType,
  targetId = null,
  details = null,
  request = null
}) {
  try {
    const auditData = {
      userId,
      action,
      targetType,
      targetId,
      details: details ? JSON.stringify(details) : null,
      ipAddress: request?.ip || request?.headers?.['x-forwarded-for'] || 'unknown',
      userAgent: request?.headers?.['user-agent'] || 'unknown'
    };

    await db.insert(auditLog).values(auditData);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Non bloccare l'operazione principale se l'audit fallisce
  }
}

export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE_PORTFOLIO: 'CREATE_PORTFOLIO',
  UPDATE_PORTFOLIO: 'UPDATE_PORTFOLIO',
  DELETE_PORTFOLIO: 'DELETE_PORTFOLIO',
  CREATE_ASSET: 'CREATE_ASSET',
  UPDATE_ASSET: 'UPDATE_ASSET',
  DELETE_ASSET: 'DELETE_ASSET',
  UPDATE_PRICE: 'UPDATE_PRICE',
  REBALANCE: 'REBALANCE',
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  CHANGE_ROLE: 'CHANGE_ROLE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  CREATE_PERFORMANCE: 'CREATE_PERFORMANCE',
  UPDATE_PERFORMANCE: 'UPDATE_PERFORMANCE',
  DELETE_PERFORMANCE: 'DELETE_PERFORMANCE',
  CREATE_TRANSACTION: 'CREATE_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION'
};

export const TARGET_TYPES = {
  USER: 'USER',
  PORTFOLIO: 'PORTFOLIO',
  LAZY_PORTFOLIO: 'LAZY_PORTFOLIO',
  ASSET: 'ASSET',
  SYSTEM: 'SYSTEM',
  PORTFOLIO_PERFORMANCE: 'PORTFOLIO_PERFORMANCE',
  TRANSACTION: 'TRANSACTION'
};