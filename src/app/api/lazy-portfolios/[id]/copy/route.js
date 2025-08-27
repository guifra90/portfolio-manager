// src/app/api/lazy-portfolios/[id]/copy/route.js
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { lazyPortfolios, lazyPortfolioEtfs, portfolios, assets } from '@/lib/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuditLog } from '@/lib/auth/audit';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { id } = params;
    const data = await request.json();
    const { name, customCreatedAt } = data;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome del portfolio richiesto' },
        { status: 400 }
      );
    }

    // Recupera il lazy portfolio con i suoi ETF
    const lazyPortfolioData = await db
      .select({
        portfolio: lazyPortfolios,
        etf: lazyPortfolioEtfs,
      })
      .from(lazyPortfolios)
      .leftJoin(lazyPortfolioEtfs, eq(lazyPortfolios.id, lazyPortfolioEtfs.lazyPortfolioId))
      .where(eq(lazyPortfolios.id, id));

    if (lazyPortfolioData.length === 0) {
      return NextResponse.json(
        { error: 'Lazy portfolio non trovato' },
        { status: 404 }
      );
    }

    const lazyPortfolio = lazyPortfolioData[0].portfolio;
    const etfs = lazyPortfolioData
      .filter(row => row.etf.id)
      .map(row => row.etf);

    if (etfs.length === 0) {
      return NextResponse.json(
        { error: 'Nessun ETF trovato per questo portfolio' },
        { status: 400 }
      );
    }

    // Crea il nuovo portfolio personale
    const [newPortfolio] = await db
      .insert(portfolios)
      .values({
        userId: session.user.id,
        name: name,
        description: `Portfolio basato su ${lazyPortfolio.name}: ${lazyPortfolio.description}`,
        customCreatedAt: customCreatedAt ? new Date(customCreatedAt) : null,
        totalValue: 0,
        totalProfit: 0,
      })
      .returning();

    // Crea gli asset corrispondenti agli ETF
    const assetsPromises = etfs.map(etf =>
      db.insert(assets).values({
        portfolioId: newPortfolio.id,
        name: etf.name,
        symbol: etf.symbol,
        isin: etf.isin || null,
        justETFUrl: etf.justETFUrl || null,
        targetAllocation: etf.allocation / 100, // Converte da percentuale (60) a decimale (0.6)
        currentPrice: 0,
        averagePurchasePrice: 0,
        quantity: 0,
        currentValue: 0,
        purchaseValue: 0,
        profitLoss: 0,
        profitLossPercentage: 0,
        currentAllocation: 0,
        imbalance: 0,
      })
    );

    await Promise.all(assetsPromises);

    // Log dell'attività
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      targetType: 'PORTFOLIO',
      targetId: newPortfolio.id,
      details: { 
        name, 
        copiedFrom: lazyPortfolio.name,
        lazyPortfolioId: id,
        assetsCount: etfs.length 
      },
      request: request,
    });

    return NextResponse.json({
      portfolio: newPortfolio,
      message: 'Portfolio copiato con successo',
    }, { status: 201 });
  } catch (error) {
    console.error('Errore nella copia del lazy portfolio:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}