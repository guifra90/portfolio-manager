// src/app/api/lazy-portfolios/route.js
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { lazyPortfolios, lazyPortfolioEtfs } from '@/lib/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuditLog } from '@/lib/auth/audit';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeEtfs = searchParams.get('include-etfs') === 'true';

    if (includeEtfs) {
      // Restituisci portfolios con i relativi ETF
      const portfoliosWithEtfs = await db
        .select({
          id: lazyPortfolios.id,
          name: lazyPortfolios.name,
          description: lazyPortfolios.description,
          riskLevel: lazyPortfolios.riskLevel,
          rebalancingFrequency: lazyPortfolios.rebalancingFrequency,
          notes: lazyPortfolios.notes,
          isActive: lazyPortfolios.isActive,
          createdAt: lazyPortfolios.createdAt,
          updatedAt: lazyPortfolios.updatedAt,
          etfs: {
            id: lazyPortfolioEtfs.id,
            name: lazyPortfolioEtfs.name,
            symbol: lazyPortfolioEtfs.symbol,
            isin: lazyPortfolioEtfs.isin,
            justETFUrl: lazyPortfolioEtfs.justETFUrl,
            allocation: lazyPortfolioEtfs.allocation,
          }
        })
        .from(lazyPortfolios)
        .leftJoin(lazyPortfolioEtfs, eq(lazyPortfolios.id, lazyPortfolioEtfs.lazyPortfolioId))
        .where(eq(lazyPortfolios.isActive, true));

      // Raggruppa ETF per portfolio
      const portfolioMap = new Map();
      portfoliosWithEtfs.forEach(row => {
        if (!portfolioMap.has(row.id)) {
          portfolioMap.set(row.id, {
            id: row.id,
            name: row.name,
            description: row.description,
            riskLevel: row.riskLevel,
            rebalancingFrequency: row.rebalancingFrequency,
            notes: row.notes,
            isActive: row.isActive,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            etfs: []
          });
        }
        if (row.etfs.id) {
          portfolioMap.get(row.id).etfs.push(row.etfs);
        }
      });

      return NextResponse.json(Array.from(portfolioMap.values()));
    } else {
      // Restituisci solo i portfolios
      const portfolios = await db
        .select()
        .from(lazyPortfolios)
        .where(eq(lazyPortfolios.isActive, true));

      return NextResponse.json(portfolios);
    }
  } catch (error) {
    console.error('Errore nel recupero dei lazy portfolios:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { name, description, riskLevel, rebalancingFrequency, notes, etfs } = data;

    if (!name || !description || !riskLevel || !rebalancingFrequency || !etfs || etfs.length === 0) {
      return NextResponse.json(
        { error: 'Tutti i campi obbligatori devono essere compilati' },
        { status: 400 }
      );
    }

    // Verifica che le allocazioni sommino a 100%
    const totalAllocation = etfs.reduce((sum, etf) => sum + etf.allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Le allocazioni devono sommare al 100%' },
        { status: 400 }
      );
    }

    // Crea il lazy portfolio
    const [lazyPortfolio] = await db
      .insert(lazyPortfolios)
      .values({
        name,
        description,
        riskLevel,
        rebalancingFrequency,
        notes,
      })
      .returning();

    // Crea gli ETF associati
    const etfPromises = etfs.map(etf =>
      db.insert(lazyPortfolioEtfs).values({
        lazyPortfolioId: lazyPortfolio.id,
        name: etf.name,
        symbol: etf.symbol,
        isin: etf.isin || null,
        justETFUrl: etf.justETFUrl || null,
        allocation: etf.allocation,
      })
    );

    await Promise.all(etfPromises);

    // Log dell'attività
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      targetType: 'LAZY_PORTFOLIO',
      targetId: lazyPortfolio.id,
      details: { name, riskLevel, etfsCount: etfs.length },
      request: request,
    });

    return NextResponse.json(lazyPortfolio, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione del lazy portfolio:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}