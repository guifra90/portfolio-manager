// src/app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { eq, count, sum, desc, gte } from 'drizzle-orm';
import db from '@/lib/db/index.js';
import { users, portfolios, assets, auditLog } from '@/lib/db/schema.js';
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions.js';
import { requireAuth, createAuthResponse } from '@/lib/auth/middleware.js';

export async function GET(request) {
  try {
    const session = await requireAuth(request);
    requirePermission(session.user.role, PERMISSIONS.SYSTEM_ADMIN);

    // Statistiche utenti
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0].count;

    const activeUsersResult = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    const activeUsers = activeUsersResult[0].count;

    const adminUsersResult = await db.select({ count: count() }).from(users).where(eq(users.role, 'admin'));
    const adminUsers = adminUsersResult[0].count;

    // Statistiche portfolios
    const totalPortfoliosResult = await db.select({ count: count() }).from(portfolios);
    const totalPortfolios = totalPortfoliosResult[0].count;

    const activePortfoliosResult = await db.select({ count: count() }).from(portfolios).where(eq(portfolios.isActive, true));
    const activePortfolios = activePortfoliosResult[0].count;

    const totalValueResult = await db.select({ total: sum(portfolios.totalValue) }).from(portfolios).where(eq(portfolios.isActive, true));
    const totalValue = totalValueResult[0].total || 0;

    const totalProfitResult = await db.select({ total: sum(portfolios.totalProfit) }).from(portfolios).where(eq(portfolios.isActive, true));
    const totalProfit = totalProfitResult[0].total || 0;

    // Statistiche assets
    const totalAssetsResult = await db.select({ count: count() }).from(assets);
    const totalAssets = totalAssetsResult[0].count;

    // Login recenti (ultimi 7 giorni)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentLoginsResult = await db.select({ count: count() })
      .from(auditLog)
      .where(eq(auditLog.action, 'LOGIN'));
    const recentLogins = recentLoginsResult[0].count;

    // Utenti più attivi (più portfolio)
    const topUsersResult = await db
      .select({
        userId: portfolios.userId,
        userName: users.name,
        userEmail: users.email,
        portfolioCount: count(portfolios.id)
      })
      .from(portfolios)
      .leftJoin(users, eq(portfolios.userId, users.id))
      .where(eq(portfolios.isActive, true))
      .groupBy(portfolios.userId, users.name, users.email)
      .orderBy(desc(count(portfolios.id)))
      .limit(5);

    // Portfolio con più valore
    const topPortfoliosResult = await db
      .select({
        id: portfolios.id,
        name: portfolios.name,
        totalValue: portfolios.totalValue,
        totalProfit: portfolios.totalProfit,
        userName: users.name,
        userEmail: users.email
      })
      .from(portfolios)
      .leftJoin(users, eq(portfolios.userId, users.id))
      .where(eq(portfolios.isActive, true))
      .orderBy(desc(portfolios.totalValue))
      .limit(5);

    // Attività recente
    const recentActivityResult = await db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        targetType: auditLog.targetType,
        targetId: auditLog.targetId,
        timestamp: auditLog.timestamp,
        userName: users.name,
        userEmail: users.email
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .orderBy(desc(auditLog.timestamp))
      .limit(10);

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        admin: adminUsers,
        inactive: totalUsers - activeUsers
      },
      portfolios: {
        total: totalPortfolios,
        active: activePortfolios,
        inactive: totalPortfolios - activePortfolios
      },
      financial: {
        totalValue,
        totalProfit,
        averagePortfolioValue: activePortfolios > 0 ? totalValue / activePortfolios : 0
      },
      assets: {
        total: totalAssets
      },
      activity: {
        recentLogins,
        topUsers: topUsersResult,
        topPortfolios: topPortfoliosResult,
        recentActivity: recentActivityResult
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return createAuthResponse(error);
  }
}