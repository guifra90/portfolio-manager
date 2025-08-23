// src/app/api/portfolios/[id]/route.js
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import db from '@/lib/db/index.js';
import { portfolios, assets } from '@/lib/db/schema.js';
import { requireAuth, createAuthResponse } from '@/lib/auth/middleware.js';
import { hasPermission, PERMISSIONS } from '@/lib/auth/permissions.js';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/auth/audit.js';

async function checkPortfolioAccess(session, portfolioId) {
  // Admin può accedere a tutto
  if (hasPermission(session.user.role, PERMISSIONS.VIEW_ALL_PORTFOLIOS)) {
    const portfolio = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .get();
    return portfolio;
  }
  
  // User normale può accedere solo ai suoi
  const portfolio = await db
    .select()
    .from(portfolios)
    .where(and(
      eq(portfolios.id, portfolioId),
      eq(portfolios.userId, session.user.id)
    ))
    .get();
  return portfolio;
}

export async function GET(request, { params }) {
  try {
    const session = await requireAuth(request);
    const portfolio = await checkPortfolioAccess(session, params.id);

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const portfolioAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.portfolioId, params.id));

    return NextResponse.json({
      ...portfolio,
      assets: portfolioAssets,
    });
  } catch (error) {
    return createAuthResponse(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await requireAuth(request);
    const { name, description } = await request.json();
    
    const portfolio = await checkPortfolioAccess(session, params.id);
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Verifica permessi di modifica
    const canEdit = hasPermission(session.user.role, PERMISSIONS.MANAGE_ALL_PORTFOLIOS) ||
                   (portfolio.userId === session.user.id && hasPermission(session.user.role, PERMISSIONS.MANAGE_OWN_PORTFOLIO));

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const updatedPortfolio = await db
      .update(portfolios)
      .set({
        name,
        description,
        updatedAt: new Date(),
      })
      .where(eq(portfolios.id, params.id))
      .returning();

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.UPDATE_PORTFOLIO,
      targetType: TARGET_TYPES.PORTFOLIO,
      targetId: params.id,
      details: { name, description },
      request
    });

    return NextResponse.json(updatedPortfolio[0]);
  } catch (error) {
    return createAuthResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await requireAuth(request);
    
    const portfolio = await checkPortfolioAccess(session, params.id);
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Verifica permessi di eliminazione
    const canDelete = hasPermission(session.user.role, PERMISSIONS.MANAGE_ALL_PORTFOLIOS) ||
                     (portfolio.userId === session.user.id && hasPermission(session.user.role, PERMISSIONS.MANAGE_OWN_PORTFOLIO));

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Soft delete
    await db
      .update(portfolios)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(portfolios.id, params.id));

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.DELETE_PORTFOLIO,
      targetType: TARGET_TYPES.PORTFOLIO,
      targetId: params.id,
      request
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createAuthResponse(error);
  }
}