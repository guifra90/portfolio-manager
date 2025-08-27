// src/app/api/lazy-portfolios/[id]/route.js
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { lazyPortfolios, lazyPortfolioEtfs } from '@/lib/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuditLog } from '@/lib/auth/audit';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Recupera il portfolio con i relativi ETF
    const portfolioWithEtfs = await db
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
      .where(eq(lazyPortfolios.id, id));

    if (portfolioWithEtfs.length === 0) {
      return NextResponse.json(
        { error: 'Portfolio non trovato' },
        { status: 404 }
      );
    }

    // Raggruppa ETF per portfolio
    const portfolio = {
      id: portfolioWithEtfs[0].id,
      name: portfolioWithEtfs[0].name,
      description: portfolioWithEtfs[0].description,
      riskLevel: portfolioWithEtfs[0].riskLevel,
      rebalancingFrequency: portfolioWithEtfs[0].rebalancingFrequency,
      notes: portfolioWithEtfs[0].notes,
      isActive: portfolioWithEtfs[0].isActive,
      createdAt: portfolioWithEtfs[0].createdAt,
      updatedAt: portfolioWithEtfs[0].updatedAt,
      etfs: portfolioWithEtfs
        .filter(row => row.etfs.id)
        .map(row => row.etfs)
    };

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('Errore nel recupero del lazy portfolio:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      );
    }

    const { id } = params;
    const data = await request.json();
    const { name, description, riskLevel, rebalancingFrequency, notes, etfs, isActive } = data;

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

    // Verifica che il portfolio esista
    const existingPortfolio = await db
      .select()
      .from(lazyPortfolios)
      .where(eq(lazyPortfolios.id, id))
      .limit(1);

    if (existingPortfolio.length === 0) {
      return NextResponse.json(
        { error: 'Portfolio non trovato' },
        { status: 404 }
      );
    }

    // Aggiorna il lazy portfolio
    await db
      .update(lazyPortfolios)
      .set({
        name,
        description,
        riskLevel,
        rebalancingFrequency,
        notes,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(lazyPortfolios.id, id));

    // Elimina gli ETF esistenti
    await db
      .delete(lazyPortfolioEtfs)
      .where(eq(lazyPortfolioEtfs.lazyPortfolioId, id));

    // Crea i nuovi ETF
    const etfPromises = etfs.map(etf =>
      db.insert(lazyPortfolioEtfs).values({
        lazyPortfolioId: id,
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
      action: 'UPDATE',
      targetType: 'LAZY_PORTFOLIO',
      targetId: id,
      details: { name, riskLevel, etfsCount: etfs.length },
      request: request,
    });

    return NextResponse.json({ message: 'Portfolio aggiornato con successo' });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del lazy portfolio:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verifica che il portfolio esista
    const existingPortfolio = await db
      .select()
      .from(lazyPortfolios)
      .where(eq(lazyPortfolios.id, id))
      .limit(1);

    if (existingPortfolio.length === 0) {
      return NextResponse.json(
        { error: 'Portfolio non trovato' },
        { status: 404 }
      );
    }

    // Elimina il portfolio (gli ETF saranno eliminati automaticamente per CASCADE)
    await db
      .delete(lazyPortfolios)
      .where(eq(lazyPortfolios.id, id));

    // Log dell'attività
    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      targetType: 'LAZY_PORTFOLIO',
      targetId: id,
      details: { portfolioName: existingPortfolio[0].name },
      request: request,
    });

    return NextResponse.json({ message: 'Portfolio eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione del lazy portfolio:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}