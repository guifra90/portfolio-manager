// src/app/api/portfolios/[id]/performance/route.js
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { portfolioAnnualPerformance, portfolios } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/auth/audit';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id: portfolioId } = params;

    // Verifica che l'utente possa accedere a questo portfolio
    const portfolio = await db.select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);

    if (portfolio.length === 0) {
      return NextResponse.json({ error: 'Portfolio non trovato' }, { status: 404 });
    }

    // Solo admin o owner del portfolio
    if (session.user.role !== 'admin' && portfolio[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Recupera tutte le performance annuali per questo portfolio
    const performances = await db.select()
      .from(portfolioAnnualPerformance)
      .where(eq(portfolioAnnualPerformance.portfolioId, portfolioId))
      .orderBy(portfolioAnnualPerformance.year);

    return NextResponse.json(performances);

  } catch (error) {
    console.error('Errore nel recupero delle performance:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id: portfolioId } = params;
    const body = await request.json();

    const { 
      year, 
      totalProfit = 0, 
      totalLoss = 0, 
      portfolioValue = 0, 
      notes = '' 
    } = body;

    if (!year || year < 1900 || year > new Date().getFullYear()) {
      return NextResponse.json({ error: 'Anno non valido' }, { status: 400 });
    }

    // Verifica che l'utente possa modificare questo portfolio
    const portfolio = await db.select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);

    if (portfolio.length === 0) {
      return NextResponse.json({ error: 'Portfolio non trovato' }, { status: 404 });
    }

    // Solo admin o owner del portfolio
    if (session.user.role !== 'admin' && portfolio[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Verifica se esiste già un record per questo anno
    const existingPerformance = await db.select()
      .from(portfolioAnnualPerformance)
      .where(and(
        eq(portfolioAnnualPerformance.portfolioId, portfolioId),
        eq(portfolioAnnualPerformance.year, year)
      ))
      .limit(1);

    if (existingPerformance.length > 0) {
      return NextResponse.json({ error: `Performance per l'anno ${year} già esistente` }, { status: 400 });
    }

    // Calcola valori derivati
    const netProfitLoss = totalProfit - totalLoss;
    const returnPercentage = portfolioValue > 0 ? ((netProfitLoss / portfolioValue) * 100) : 0;

    // Inserisci nuova performance
    const newPerformance = await db.insert(portfolioAnnualPerformance)
      .values({
        portfolioId,
        year,
        totalProfit,
        totalLoss,
        netProfitLoss,
        portfolioValue,
        returnPercentage,
        notes
      })
      .returning();

    // Log dell'azione
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE_PERFORMANCE',
      targetType: 'PORTFOLIO_PERFORMANCE',
      targetId: newPerformance[0].id,
      details: { portfolioId, year, totalProfit, totalLoss, portfolioValue },
      request
    });

    return NextResponse.json(newPerformance[0], { status: 201 });

  } catch (error) {
    console.error('Errore nella creazione della performance:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}