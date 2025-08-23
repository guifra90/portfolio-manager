// src/app/api/assets/route.js
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import db from '@/lib/db/index.js';
import { assets, portfolios } from '@/lib/db/schema.js';
import { requireAuth, createAuthResponse } from '@/lib/auth/middleware.js';
import { hasPermission, PERMISSIONS } from '@/lib/auth/permissions.js';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/auth/audit.js';

async function checkAssetAccess(session, portfolioId) {
  // Admin può accedere a tutto
  if (hasPermission(session.user.role, PERMISSIONS.MANAGE_ALL_ASSETS)) {
    const portfolio = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .get();
    return portfolio;
  }
  
  // User normale può accedere solo ai suoi portfolio
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

export async function POST(request) {
  try {
    const session = await requireAuth(request);
    const assetData = await request.json();

    // Verifica accesso al portfolio
    const portfolio = await checkAssetAccess(session, assetData.portfolioId);
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found or access denied' }, { status: 404 });
    }

    const newAsset = await db
      .insert(assets)
      .values({
        ...assetData,
        currentValue: assetData.quantity * assetData.currentPrice,
      })
      .returning();

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.CREATE_ASSET,
      targetType: TARGET_TYPES.ASSET,
      targetId: newAsset[0].id,
      details: { ...assetData, portfolioId: assetData.portfolioId },
      request
    });

    return NextResponse.json(newAsset[0]);
  } catch (error) {
    return createAuthResponse(error);
  }
}