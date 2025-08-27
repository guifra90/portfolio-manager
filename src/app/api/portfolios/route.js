// src/app/api/portfolios/route.js
import { NextResponse } from 'next/server';
import { eq, desc, and } from 'drizzle-orm';
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
          customCreatedAt: portfolios.customCreatedAt,
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
      // Utenti normali vedono solo i propri portfolio attivi
      userPortfolios = await db
        .select()
        .from(portfolios)
        .where(and(eq(portfolios.userId, session.user.id), eq(portfolios.isActive, true)))
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
    
    if (!hasPermission(session.user.role, PERMISSIONS.CREATE_PORTFOLIO)) {
      return NextResponse.json(
        { error: 'Non hai i permessi per creare portfolio' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, customCreatedAt } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Il nome del portfolio è obbligatorio' },
        { status: 400 }
      );
    }

    const portfolioData = {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
    };

    if (customCreatedAt) {
      portfolioData.customCreatedAt = new Date(customCreatedAt);
    }

    const [newPortfolio] = await db
      .insert(portfolios)
      .values(portfolioData)
      .returning();

    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.CREATE_PORTFOLIO,
      targetType: TARGET_TYPES.PORTFOLIO,
      targetId: newPortfolio.id,
      details: { name: newPortfolio.name, description: newPortfolio.description },
      request
    });

    return NextResponse.json(newPortfolio, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione del portfolio:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}