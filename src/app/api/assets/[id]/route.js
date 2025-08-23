// src/app/api/assets/[id]/route.js
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

export async function PUT(request, { params }) {
  try {
    const session = await requireAuth(request);
    const assetData = await request.json();

    // Trova l'asset e verifica l'accesso
    const asset = await db.select().from(assets).where(eq(assets.id, params.id)).get();
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const portfolio = await checkAssetAccess(session, asset.portfolioId);
    if (!portfolio) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updatedAsset = await db
      .update(assets)
      .set({
        ...assetData,
        currentValue: assetData.quantity * assetData.currentPrice,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, params.id))
      .returning();

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.UPDATE_ASSET,
      targetType: TARGET_TYPES.ASSET,
      targetId: params.id,
      details: assetData,
      request
    });

    return NextResponse.json(updatedAsset[0]);
  } catch (error) {
    return createAuthResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await requireAuth(request);

    // Trova l'asset e verifica l'accesso
    const asset = await db.select().from(assets).where(eq(assets.id, params.id)).get();
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const portfolio = await checkAssetAccess(session, asset.portfolioId);
    if (!portfolio) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await db.delete(assets).where(eq(assets.id, params.id));

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.DELETE_ASSET,
      targetType: TARGET_TYPES.ASSET,
      targetId: params.id,
      request
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createAuthResponse(error);
  }
}