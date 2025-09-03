// src/app/api/portfolios/[id]/performance/[performanceId]/route.js
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { portfolioAnnualPerformance, portfolios } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/auth/audit';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id: portfolioId, performanceId } = params;
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

    // Verifica che la performance esista
    const existingPerformance = await db.select()
      .from(portfolioAnnualPerformance)
      .where(and(
        eq(portfolioAnnualPerformance.id, performanceId),
        eq(portfolioAnnualPerformance.portfolioId, portfolioId)
      ))
      .limit(1);

    if (existingPerformance.length === 0) {
      return NextResponse.json({ error: 'Performance non trovata' }, { status: 404 });
    }

    // Calcola valori derivati
    const netProfitLoss = totalProfit - totalLoss;
    const returnPercentage = portfolioValue > 0 ? ((netProfitLoss / portfolioValue) * 100) : 0;

    // Aggiorna performance
    const updatedPerformance = await db.update(portfolioAnnualPerformance)
      .set({
        year,
        totalProfit,
        totalLoss,
        netProfitLoss,
        portfolioValue,
        returnPercentage,
        notes,
        updatedAt: new Date()
      })
      .where(eq(portfolioAnnualPerformance.id, performanceId))
      .returning();

    // Log dell'azione
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE_PERFORMANCE',
      targetType: 'PORTFOLIO_PERFORMANCE',
      targetId: performanceId,
      details: { portfolioId, year, totalProfit, totalLoss, portfolioValue },
      request
    });

    return NextResponse.json(updatedPerformance[0]);

  } catch (error) {
    console.error('Errore nell\'aggiornamento della performance:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id: portfolioId, performanceId } = params;

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

    // Verifica che la performance esista
    const existingPerformance = await db.select()
      .from(portfolioAnnualPerformance)
      .where(and(
        eq(portfolioAnnualPerformance.id, performanceId),
        eq(portfolioAnnualPerformance.portfolioId, portfolioId)
      ))
      .limit(1);

    if (existingPerformance.length === 0) {
      return NextResponse.json({ error: 'Performance non trovata' }, { status: 404 });
    }

    // Elimina performance
    await db.delete(portfolioAnnualPerformance)
      .where(eq(portfolioAnnualPerformance.id, performanceId));

    // Log dell'azione
    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE_PERFORMANCE',
      targetType: 'PORTFOLIO_PERFORMANCE',
      targetId: performanceId,
      details: { portfolioId, year: existingPerformance[0].year },
      request
    });

    return NextResponse.json({ message: 'Performance eliminata con successo' });

  } catch (error) {
    console.error('Errore nell\'eliminazione della performance:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}