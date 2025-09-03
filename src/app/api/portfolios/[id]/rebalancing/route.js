// src/app/api/portfolios/[id]/rebalancing/route.js
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { portfolioTransactions, portfolios, assets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/auth/audit';
import { createId } from '@paralleldrive/cuid2';

// Funzione per ricalcolare le allocazioni del portfolio dopo gli aggiornamenti
async function recalculatePortfolioAllocations(portfolioId) {
  try {
    // Recupera tutti gli asset del portfolio
    const portfolioAssets = await db.select()
      .from(assets)
      .where(eq(assets.portfolioId, portfolioId));

    if (portfolioAssets.length === 0) return;

    // Calcola il valore totale del portfolio
    const totalValue = portfolioAssets.reduce((sum, asset) => sum + asset.currentValue, 0);

    if (totalValue <= 0) return;

    // Aggiorna le allocazioni e sbilanciamenti per ogni asset
    for (const asset of portfolioAssets) {
      const currentAllocation = asset.currentValue / totalValue;
      const imbalance = currentAllocation - asset.targetAllocation;

      await db.update(assets)
        .set({
          currentAllocation: currentAllocation,
          imbalance: imbalance,
          updatedAt: new Date(),
        })
        .where(eq(assets.id, asset.id));
    }

    // Aggiorna i totali del portfolio
    const totalProfit = portfolioAssets.reduce((sum, asset) => sum + asset.profitLoss, 0);
    
    await db.update(portfolios)
      .set({
        totalValue: totalValue,
        totalProfit: totalProfit,
        updatedAt: new Date(),
      })
      .where(eq(portfolios.id, portfolioId));

  } catch (error) {
    console.error('Errore nel ricalcolo delle allocazioni:', error);
    throw error;
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
      transactions, 
      cashDeposit = null, 
      notes = '', 
      executedAt = new Date() 
    } = body;

    // Validazioni di base
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'Lista transazioni non valida' }, { status: 400 });
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

    // Genera un batch ID per raggruppare tutte le transazioni di questo ribilanciamento
    const batchId = createId();
    const executionDate = new Date(executedAt);

    const createdTransactions = [];

    // Se c'è un apporto di liquidità, crealo per primo
    if (cashDeposit && cashDeposit > 0) {
      const cashTransaction = await db.insert(portfolioTransactions)
        .values({
          portfolioId,
          type: 'CASH_DEPOSIT',
          assetId: null,
          assetSymbol: null,
          quantity: null,
          price: null,
          amount: cashDeposit,
          fees: 0,
          executedBy: session.user.id,
          executedAt: executionDate,
          notes: `Apporto liquidità - ${notes}`,
          rebalancingBatch: batchId,
        })
        .returning();

      createdTransactions.push(cashTransaction[0]);
    }

    // Crea tutte le transazioni del ribilanciamento e aggiorna gli asset
    for (const transaction of transactions) {
      const { 
        assetId, 
        assetSymbol, 
        action, 
        quantity, 
        price, 
        fees = 0 
      } = transaction;

      // Validazioni per ogni transazione
      if (!assetId || !assetSymbol || !action || !quantity || !price) {
        throw new Error(`Dati mancanti nella transazione per ${assetSymbol}`);
      }

      if (!['BUY', 'SELL'].includes(action)) {
        throw new Error(`Azione non valida: ${action}`);
      }

      const amount = action === 'BUY' 
        ? -(quantity * price + fees) // Negativo per acquisti (uscita di denaro)
        : (quantity * price - fees);  // Positivo per vendite (entrata di denaro)

      // Crea la transazione
      const newTransaction = await db.insert(portfolioTransactions)
        .values({
          portfolioId,
          type: action,
          assetId,
          assetSymbol,
          quantity,
          price,
          amount,
          fees,
          executedBy: session.user.id,
          executedAt: executionDate,
          notes,
          rebalancingBatch: batchId,
        })
        .returning();

      createdTransactions.push(newTransaction[0]);

      // Aggiorna la quantità dell'asset
      const currentAsset = await db.select()
        .from(assets)
        .where(eq(assets.id, assetId))
        .limit(1);

      if (currentAsset.length > 0) {
        const asset = currentAsset[0];
        const newQuantity = action === 'BUY' 
          ? asset.quantity + quantity 
          : asset.quantity - quantity;

        // Calcola il nuovo prezzo medio di acquisto per gli acquisti
        let newAveragePurchasePrice = asset.averagePurchasePrice;
        
        if (action === 'BUY' && newQuantity > 0) {
          // Formula: ((prezzo_medio_vecchio * quantità_vecchia) + (prezzo_nuovo * quantità_nuova)) / quantità_totale
          const oldValue = asset.averagePurchasePrice * asset.quantity;
          const newValue = price * quantity;
          newAveragePurchasePrice = (oldValue + newValue) / newQuantity;
        }

        // Calcola i nuovi valori
        const currentValue = newQuantity * price;
        const purchaseValue = newQuantity * newAveragePurchasePrice;
        const profitLoss = currentValue - purchaseValue;
        const profitLossPercentage = purchaseValue > 0 ? (profitLoss / purchaseValue) * 100 : 0;

        // Aggiorna l'asset nel database
        await db.update(assets)
          .set({
            quantity: newQuantity,
            currentPrice: price, // Aggiorna anche il prezzo corrente
            averagePurchasePrice: newAveragePurchasePrice,
            currentValue: currentValue,
            purchaseValue: purchaseValue,
            profitLoss: profitLoss,
            profitLossPercentage: profitLossPercentage,
            updatedAt: new Date(),
          })
          .where(eq(assets.id, assetId));
      }
    }

    // Ricalcola le allocazioni del portfolio dopo aver aggiornato tutti gli asset
    await recalculatePortfolioAllocations(portfolioId);

    // Log dell'azione di ribilanciamento
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.REBALANCE,
      targetType: 'PORTFOLIO',
      targetId: portfolioId,
      details: { 
        batchId,
        transactionsCount: createdTransactions.length,
        cashDeposit,
        totalAssets: transactions.length
      },
      request
    });

    return NextResponse.json({
      success: true,
      batchId,
      transactions: createdTransactions
    });

  } catch (error) {
    console.error('Errore nel salvataggio del ribilanciamento:', error);
    return NextResponse.json({ 
      error: error.message || 'Errore interno del server' 
    }, { status: 500 });
  }
}