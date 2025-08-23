// scripts/migrate-add-purchase-price.js
import db from '../src/lib/db/index.js';

async function migrateAddPurchasePrice() {
  console.log('🔄 Aggiungendo campi prezzo medio di acquisto agli asset esistenti...');

  try {
    // Aggiungiamo le colonne manualmente con ALTER TABLE
    console.log('📋 Aggiungendo colonne al database...');
    
    // Utilizziamo query SQL dirette per aggiungere le colonne con valori di default
    await db.run(`ALTER TABLE assets ADD COLUMN average_purchase_price REAL DEFAULT 0`);
    console.log('✅ Colonna average_purchase_price aggiunta');
    
    await db.run(`ALTER TABLE assets ADD COLUMN purchase_value REAL DEFAULT 0`);
    console.log('✅ Colonna purchase_value aggiunta');
    
    await db.run(`ALTER TABLE assets ADD COLUMN profit_loss_percentage REAL DEFAULT 0`);
    console.log('✅ Colonna profit_loss_percentage aggiunta');

    // Ora aggiorniamo i dati esistenti con valori realistici
    console.log('💰 Calcolando prezzi medi di acquisto realistici...');
    
    const assets = await db.select().from(assets);
    
    for (const asset of assets) {
      // Calcoliamo un prezzo medio di acquisto realistico
      // Assumiamo che l'asset sia stato acquistato a un prezzo leggermente più basso del prezzo attuale
      const currentPrice = asset.currentPrice;
      const profitLoss = asset.profitLoss;
      const quantity = asset.quantity;
      
      // Calcoliamo il prezzo di acquisto medio basandosi sul P&L attuale
      let averagePurchasePrice;
      if (quantity > 0) {
        const currentValue = currentPrice * quantity;
        const purchaseValue = currentValue - profitLoss;
        averagePurchasePrice = purchaseValue / quantity;
        
        // Aggiorniamo l'asset con i nuovi valori
        await db
          .update(assets)
          .set({
            averagePurchasePrice: Math.max(averagePurchasePrice, 0.01), // Minimo 0.01
            purchaseValue: purchaseValue,
            profitLossPercentage: purchaseValue > 0 ? (profitLoss / purchaseValue) * 100 : 0
          })
          .where(eq(assets.id, asset.id));
          
        console.log(`💱 ${asset.symbol}: Prezzo acquisto €${averagePurchasePrice.toFixed(2)} → Attuale €${currentPrice.toFixed(2)}`);
      }
    }

    console.log('🎉 Migrazione completata con successo!');
    console.log('📊 Tutti gli asset ora hanno:');
    console.log('   - Prezzo medio di acquisto');
    console.log('   - Valore di acquisto');
    console.log('   - Percentuale P&L');
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  }
}

migrateAddPurchasePrice();