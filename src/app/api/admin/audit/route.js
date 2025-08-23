// src/app/api/admin/audit/route.js
import { NextResponse } from 'next/server';
import { eq, desc, like, and } from 'drizzle-orm';
import db from '@/lib/db/index.js';
import { auditLog, users } from '@/lib/db/schema.js';
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions.js';
import { requireAuth, createAuthResponse } from '@/lib/auth/middleware.js';

export async function GET(request) {
  try {
    const session = await requireAuth(request);
    requirePermission(session.user.role, PERMISSIONS.VIEW_AUDIT_LOG);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const action = searchParams.get('action');
    const targetType = searchParams.get('targetType');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    // Costruisci le condizioni di filtro
    let whereConditions = [];

    if (action) {
      whereConditions.push(eq(auditLog.action, action));
    }

    if (targetType) {
      whereConditions.push(eq(auditLog.targetType, targetType));
    }

    if (userId) {
      whereConditions.push(eq(auditLog.userId, userId));
    }

    if (search) {
      whereConditions.push(like(users.name, `%${search}%`));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Query principale
    const logs = await db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        targetType: auditLog.targetType,
        targetId: auditLog.targetId,
        details: auditLog.details,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        timestamp: auditLog.timestamp,
        userId: auditLog.userId,
        userName: users.name,
        userEmail: users.email
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLog.timestamp))
      .limit(limit)
      .offset(offset);

    // Count totale per paginazione
    const totalCountResult = await db
      .select({ count: 'COUNT(*) as count' })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .where(whereClause);

    const totalCount = Array.isArray(totalCountResult) && totalCountResult.length > 0 
      ? parseInt(totalCountResult[0].count) 
      : 0;

    return NextResponse.json({
      logs: logs.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Audit log error:', error);
    return createAuthResponse(error);
  }
}