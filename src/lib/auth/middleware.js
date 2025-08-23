// src/lib/auth/middleware.js
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth.js';
import { hasPermission } from './permissions.js';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from './audit.js';

export async function requireAuth(request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

export async function requireRole(request, requiredRole) {
  const session = await requireAuth(request);
  
  if (session.user.role !== requiredRole && session.user.role !== 'admin') {
    throw new Error('Insufficient role');
  }
  
  return session;
}

export async function requirePermission(request, permission) {
  const session = await requireAuth(request);
  
  if (!hasPermission(session.user.role, permission)) {
    // Log tentativo di accesso non autorizzato
    await createAuditLog({
      userId: session.user.id,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      targetType: TARGET_TYPES.SYSTEM,
      details: { permission, attemptedAction: request.url },
      request
    });
    
    throw new Error(`Insufficient permissions: ${permission}`);
  }
  
  return session;
}

export function createAuthResponse(error) {
  const statusMap = {
    'Unauthorized': 401,
    'Insufficient role': 403,
    'Insufficient permissions': 403
  };
  
  const status = statusMap[error.message.split(':')[0]] || 500;
  
  return Response.json(
    { error: error.message }, 
    { status }
  );
}