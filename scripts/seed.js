// scripts/seed.js
import db from '../src/lib/db/index.js';
import { users, portfolios, assets } from '../src/lib/db/schema.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Crea utente admin
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const admin = await db.insert(users).values({
      email: 'guidottifrancescofi@gmail.com',
      name: 'Amministratore Sistema',
      password: adminPasswordHash,
      role: 'admin',
    }).returning();

    console.log('✅ Utente admin creato');

    // Crea utente demo normale
    const userPasswordHash = await bcrypt.hash('password123', 12);
    const user = await db.insert(users).values({
      email: 'demo@portfoliomanager.com',
      name: 'Utente Demo',
      password: userPasswordHash,
      role: 'user',
    }).returning();

    console.log('✅ Utente demo creato');

    // Crea portfolio per utente demo
    const portfolio = await db.insert(portfolios).values({
      userId: user[0].id,
      name: 'Portfolio ETF Diversificato',
      description: 'Portfolio bilanciato con ETF globali - Dati reali dal file Excel',
      totalValue: 115259.02,
      totalProfit: 14433.62,
    }).returning();

    console.log('✅ Portfolio demo creato');

    // Crea portfolio admin per test
    const adminPortfolio = await db.insert(portfolios).values({
      userId: admin[0].id,
      name: 'Portfolio Admin Test',
      description: 'Portfolio di test per amministratore',
      totalValue: 50000.00,
      totalProfit: 2500.00,
    }).returning();

    console.log('✅ Portfolio admin creato');

    // Asset per il portfolio demo (i tuoi ETF reali)
    const assetData = [
      {
        portfolioId: portfolio[0].id,
        name: 'iShares Core MSCI World UCITS ETF USD (Acc)',
        symbol: 'SWDA',
        isin: 'IE00B4L5Y983',
        justETFUrl: 'https://www.justetf.com/it/etf-profile.html?isin=IE00B4L5Y983',
        targetAllocation: 0.20,
        currentPrice: 107.08,
        quantity: 226,
        currentValue: 24200.08,
        profitLoss: 4027.32,
        currentAllocation: 0.21,
        imbalance: 0.01,
      },
      {
        portfolioId: portfolio[0].id,
        name: 'iShares MSCI World Small Cap UCITS ETF',
        symbol: 'WSML',
        isin: 'IE00BF4RFH31',
        justETFUrl: 'https://www.justetf.com/it/etf-profile.html?isin=IE00BF4RFH31',
        targetAllocation: 0.20,
        currentPrice: 7.54,
        quantity: 3092,
        currentValue: 23313.68,
        profitLoss: 3184.76,
        currentAllocation: 0.2023,
        imbalance: 0.0023,
      },
      {
        portfolioId: portfolio[0].id,
        name: 'Xtrackers Global Government Bond UCITS ETF 5C',
        symbol: 'XGLE',
        isin: 'LU0378818131',
        justETFUrl: 'https://www.justetf.com/it/etf-profile.html?isin=LU0378818131',
        targetAllocation: 0.20,
        currentPrice: 229.04,
        quantity: 91,
        currentValue: 20842.64,
        profitLoss: 656.11,
        currentAllocation: 0.1808,
        imbalance: -0.0192,
      },
      {
        portfolioId: portfolio[0].id,
        name: 'Amundi EUR Overnight Return UCITS ETF Acc',
        symbol: 'C12',
        isin: 'LU1931974692',
        justETFUrl: 'https://www.justetf.com/it/etf-profile.html?isin=LU1931974692',
        targetAllocation: 0.20,
        currentPrice: 110.65,
        quantity: 188,
        currentValue: 20802.20,
        profitLoss: 631.68,
        currentAllocation: 0.1805,
        imbalance: -0.0195,
      },
      {
        portfolioId: portfolio[0].id,
        name: 'Invesco Physical Gold A',
        symbol: 'SGLD',
        isin: 'IE00B579F325',
        justETFUrl: 'https://www.justetf.com/it/etf-profile.html?isin=IE00B579F325',
        targetAllocation: 0.20,
        currentPrice: 258.42,
        quantity: 101,
        currentValue: 26100.42,
        profitLoss: 5933.75,
        currentAllocation: 0.2265,
        imbalance: 0.0265,
      },
    ];

    await db.insert(assets).values(assetData);
    console.log('✅ Asset demo creati');

    // Asset per portfolio admin
    const adminAssetData = [
      {
        portfolioId: adminPortfolio[0].id,
        name: 'Vanguard S&P 500 UCITS ETF',
        symbol: 'VUSA',
        isin: 'IE00B3XXRP09',
        justETFUrl: 'https://www.justetf.com/it/etf-profile.html?isin=IE00B3XXRP09',
        targetAllocation: 0.60,
        currentPrice: 85.50,
        quantity: 350,
        currentValue: 29925.00,
        profitLoss: 1500.00,
        currentAllocation: 0.60,
        imbalance: 0.00,
      },
      {
        portfolioId: adminPortfolio[0].id,
        name: 'Vanguard FTSE Emerging Markets UCITS ETF',
        symbol: 'VFEM',
        isin: 'IE00B3VVMM84',
        justETFUrl: 'https://www.justetf.com/it/etf-profile.html?isin=IE00B3VVMM84',
        targetAllocation: 0.40,
        currentPrice: 50.25,
        quantity: 400,
        currentValue: 20100.00,
        profitLoss: 1000.00,
        currentAllocation: 0.40,
        imbalance: 0.00,
      },
    ];

    await db.insert(assets).values(adminAssetData);
    console.log('✅ Asset admin creati');

    console.log('🎉 Seeding completato con successo!');
    console.log('');
    console.log('='.repeat(50));
    console.log('📋 CREDENZIALI DI ACCESSO');
    console.log('='.repeat(50));
    console.log('');
    console.log('🔑 ADMIN (accesso completo):');
    console.log('   Email: admin@portfoliomanager.com');
    console.log('   Password: admin123');
    console.log('   - Può vedere tutti i portfolio');
    console.log('   - Può gestire tutti gli utenti');
    console.log('   - Ha accesso all\'admin panel');
    console.log('');
    console.log('👤 USER DEMO (accesso normale):');
    console.log('   Email: demo@portfoliomanager.com');
    console.log('   Password: password123');
    console.log('   - Vede solo i propri portfolio');
    console.log('   - Contiene i tuoi ETF reali');
    console.log('');
    console.log('='.repeat(50));
    console.log('🚀 Avvia l\'app con: npm run dev');
    console.log('🌐 Poi vai su: http://localhost:3000');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante il seeding:', error);
    process.exit(1);
  }
}

seed();