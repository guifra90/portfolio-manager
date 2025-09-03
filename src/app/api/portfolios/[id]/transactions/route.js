// src/app/api/portfolios/[id]/transactions/route.js
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { portfolioTransactions, portfolios } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/auth/audit';
import { createId } from '@paralleldrive/cuid2';

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

    // Recupera tutte le transazioni del portfolio, ordinate per data
    const transactions = await db.select()
      .from(portfolioTransactions)
      .where(eq(portfolioTransactions.portfolioId, portfolioId))
      .orderBy(desc(portfolioTransactions.executedAt));

    return NextResponse.json(transactions);

  } catch (error) {
    console.error('Errore nel caricamento delle transazioni:', error);
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
      type, 
      assetId = null, 
      assetSymbol = null, 
      quantity = null, 
      price = null, 
      amount, 
      fees = 0, 
      executedAt = new Date(), 
      notes = '', 
      rebalancingBatch = null 
    } = body;

    // Validazioni di base
    if (!type || !['BUY', 'SELL', 'CASH_DEPOSIT', 'CASH_WITHDRAWAL'].includes(type)) {
      return NextResponse.json({ error: 'Tipo di transazione non valido' }, { status: 400 });
    }

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Importo non valido' }, { status: 400 });
    }

    // Per transazioni BUY/SELL verifica che ci siano i dati dell'asset
    if ((type === 'BUY' || type === 'SELL') && (!quantity || !price)) {
      return NextResponse.json({ error: 'Quantità e prezzo sono obbligatori per acquisti/vendite' }, { status: 400 });
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

    // Crea la transazione
    const newTransaction = await db.insert(portfolioTransactions)
      .values({
        portfolioId,
        type,
        assetId,
        assetSymbol,
        quantity,
        price,
        amount,
        fees,
        executedBy: session.user.id,
        executedAt: new Date(executedAt),
        notes,
        rebalancingBatch,
      })
      .returning();

    // Log dell'azione
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.CREATE_ASSET, // Riutilizziamo questa azione
      targetType: 'PORTFOLIO',
      targetId: portfolioId,
      details: { 
        transactionId: newTransaction[0].id,
        type, 
        amount, 
        assetSymbol 
      },
      request
    });

    return NextResponse.json(newTransaction[0]);

  } catch (error) {
    console.error('Errore nella creazione della transazione:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}