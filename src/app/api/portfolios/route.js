// src/app/api/portfolios/route.js
import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import db from '@/lib/db/index.js';
import { portfolios, users } from '@/lib/db/schema.js';
import { requireAuth, createAuthResponse } from '@/lib/auth/middleware.js';
import { hasPermission, PERMISSIONS } from '@/lib/auth/permissions.js';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/auth/audit.js';

export async function GET(request) {
  try {
    const session = await requireAuth(request);
    
    let userPortfolios;
    
    // Se è admin, può vedere tutti i portfolio
    if (hasPermission(session.user.role, PERMISSIONS.VIEW_ALL_PORTFOLIOS)) {
      userPortfolios = await db
        .select({
          id: portfolios.id,
          name: portfolios.name,
          description: portfolios.description,
          totalValue: portfolios.totalValue,
          totalProfit: portfolios.totalProfit,
          isActive: portfolios.isActive,
          createdAt: portfolios.createdAt,
          updatedAt: portfolios.updatedAt,
          userId: portfolios.userId,
          userName: users.name,
          userEmail: users.email
        })
        .from(portfolios)
        .leftJoin(users, eq(portfolios.userId, users.id))
        .where(eq(portfolios.isActive, true))
        .orderBy(desc(portfolios.updatedAt));
    } else {
      // Utenti normali vedono solo i propri
      userPortfolios = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, session.user.id))
        .orderBy(desc(portfolios.updatedAt));
    }

    return NextResponse.json(userPortfolios);
  } catch (error) {
    return createAuthResponse(error);
  }
}

export async function POST(request) {
  try {
    const session = await requireAuth(request);
    const { name, description, userId } = await request.json();

    // Determina a quale utente assegnare il portfolio
    let targetUserId = session.user.id;
    
    // Se è admin e specifica un userId, può creare per altri utenti
    if (hasPermission(session.user.role, PERMISSIONS.MANAGE_ALL_PORTFOLIOS) && userId) {
      targetUserId = userId;
    }

    const newPortfolio = await db
      .insert(portfolios)
      .values({
        userId: targetUserId,
        name,
        description,
      })
      .returning();

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.CREATE_PORTFOLIO,
      targetType: TARGET_TYPES.PORTFOLIO,
      targetId: newPortfolio[0].id,
      details: { name, description, targetUserId },
      request
    });

    return NextResponse.json(newPortfolio[0]);
  } catch (error) {
    return createAuthResponse(error);
  }
}