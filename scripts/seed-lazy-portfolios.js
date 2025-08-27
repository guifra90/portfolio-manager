// scripts/seed-lazy-portfolios.js
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { lazyPortfolios, lazyPortfolioEtfs } from '../src/lib/db/schema.js';
import { createId } from '@paralleldrive/cuid2';

const sqlite = new Database('./database/portfolio.db');
const db = drizzle(sqlite);

const lazyPortfoliosData = [
  {
    name: "Three-Fund Portfolio (Bogleheads)",
    description: "Il portafoglio più classico e bilanciato. Ideale per principianti che vogliono diversificazione globale con una componente obbligazionaria per ridurre la volatilità. Semplice da gestire con ribilanciamenti poco frequenti.",
    riskLevel: 3,
    rebalancingFrequency: "annuale",
    notes: "Allocazione: 60% Azionario USA + 20% Azionario Internazionale + 20% Obbligazionario. Ribilanciamento: Annuale (dicembre) o quando un asset si discosta >5% dal target.",
    etfs: [
      {
        name: "Vanguard S&P 500 UCITS ETF",
        symbol: "VUSA",
        isin: "IE00B3XXRP09",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00B3XXRP09",
        allocation: 60
      },
      {
        name: "Vanguard FTSE Developed World ex North America UCITS ETF",
        symbol: "VHVG",
        isin: "IE00BKX55T58",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00BKX55T58",
        allocation: 20
      },
      {
        name: "Vanguard Global Aggregate Bond UCITS ETF",
        symbol: "VAGF",
        isin: "IE00BG47KH54",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00BG47KH54",
        allocation: 20
      }
    ]
  },
  {
    name: "Two-Fund Portfolio",
    description: "Ancora più semplice del Three-Fund. Un solo ETF azionario che copre tutto il mondo (mercati sviluppati ed emergenti). Perfetto per chi vuole massima semplicità con diversificazione globale automatica. Solo 2 ETF da ribilanciare!",
    riskLevel: 3,
    rebalancingFrequency: "semestrale",
    notes: "Allocazione: 70% Azionario Globale + 30% Obbligazionario. Ribilanciamento: Semestrale o quando un asset si discosta >5% dal target.",
    etfs: [
      {
        name: "Vanguard FTSE All-World UCITS ETF",
        symbol: "VWCE",
        isin: "IE00BK5BQT80",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00BK5BQT80",
        allocation: 70
      },
      {
        name: "Vanguard Global Aggregate Bond UCITS ETF",
        symbol: "VAGF",
        isin: "IE00BG47KH54",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00BG47KH54",
        allocation: 30
      }
    ]
  },
  {
    name: "All Weather Portfolio (Ray Dalio)",
    description: "Progettato per funzionare in tutti gli ambienti economici. Molto conservativo con focus sulla protezione del capitale. Richiede ribilanciamenti più frequenti per mantenere l'equilibrio tra le 5 asset class. Adatto a investitori avversi al rischio.",
    riskLevel: 2,
    rebalancingFrequency: "trimestrale",
    notes: "Allocazione: 30% Azioni + 40% Obbligazioni Long-Term + 15% Obbligazioni Medium-Term + 7.5% Commodities + 7.5% TIPS. Ribilanciamento: Trimestrale (data la complessità e sensibilità agli shock economici).",
    etfs: [
      {
        name: "iShares Core MSCI World UCITS ETF",
        symbol: "IWDA",
        isin: "IE00B4L5Y983",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00B4L5Y983",
        allocation: 30
      },
      {
        name: "iShares Core Global Aggregate Bond UCITS ETF",
        symbol: "AGGG",
        isin: "IE00BDBRDM35",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00BDBRDM35",
        allocation: 40
      },
      {
        name: "Xtrackers II Eurozone Government Bond 7-10 UCITS ETF",
        symbol: "XGLE",
        isin: "LU0290358497",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=LU0290358497",
        allocation: 15
      },
      {
        name: "iShares Diversified Commodity Swap UCITS ETF",
        symbol: "ICOM",
        isin: "IE00BDFL4P12",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00BDFL4P12",
        allocation: 7.5
      },
      {
        name: "iShares Global Inflation Linked Government Bond UCITS ETF",
        symbol: "GILE",
        isin: "IE00B3VWN518",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00B3VWN518",
        allocation: 7.5
      }
    ]
  },
  {
    name: "Golden Butterfly Portfolio",
    description: "Portfolio molto diversificato con protezione dall'inflazione tramite oro. Le small-cap value aggiungono potenziale di rendimento. L'allocazione 20/20/20/20/20 è facile da memorizzare e mantenere. Ideale per chi cerca stabilità con un tocco di crescita.",
    riskLevel: 2,
    rebalancingFrequency: "semestrale",
    notes: "Allocazione: 20% Azioni USA + 20% Azioni Small-Cap Value + 20% Obbligazioni Long-Term + 20% Obbligazioni Short-Term + 20% Oro. Ribilanciamento: Semestrale o quando un asset si discosta >5% dal target.",
    etfs: [
      {
        name: "Vanguard S&P 500 UCITS ETF",
        symbol: "VUSA",
        isin: "IE00B3XXRP09",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00B3XXRP09",
        allocation: 20
      },
      {
        name: "iShares MSCI World Small Cap UCITS ETF",
        symbol: "WSML",
        isin: "IE00BF4RFH31",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00BF4RFH31",
        allocation: 20
      },
      {
        name: "iShares Core Global Aggregate Bond UCITS ETF",
        symbol: "AGGG",
        isin: "IE00BDBRDM35",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00BDBRDM35",
        allocation: 20
      },
      {
        name: "Xtrackers II EUR Corporate Bond 1-3 UCITS ETF",
        symbol: "XCOS",
        isin: "LU0484968812",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=LU0484968812",
        allocation: 20
      },
      {
        name: "iShares Physical Gold ETC",
        symbol: "IGLN",
        isin: "IE00B4ND3602",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00B4ND3602",
        allocation: 20
      }
    ]
  },
  {
    name: "Core-Four Portfolio",
    description: "Aggiunge esposizione al settore immobiliare per diversificazione extra. Più aggressivo degli altri con focus sulla crescita a lungo termine. I REITs richiedono monitoraggio più attento data la loro volatilità. Adatto a investitori con orizzonte temporale lungo (15+ anni).",
    riskLevel: 4,
    rebalancingFrequency: "semestrale",
    notes: "Allocazione: 48% Azioni USA + 24% Azioni Internazionali + 20% Obbligazioni + 8% REITs. Ribilanciamento: Semestrale (i REITs tendono ad essere più volatili).",
    etfs: [
      {
        name: "Vanguard S&P 500 UCITS ETF",
        symbol: "VUSA",
        isin: "IE00B3XXRP09",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00B3XXRP09",
        allocation: 48
      },
      {
        name: "Vanguard FTSE Developed World ex North America UCITS ETF",
        symbol: "VHVG",
        isin: "IE00BKX55T58",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00BKX55T58",
        allocation: 24
      },
      {
        name: "Vanguard Global Aggregate Bond UCITS ETF",
        symbol: "VAGF",
        isin: "IE00BG47KH54",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00BG47KH54",
        allocation: 20
      },
      {
        name: "iShares Global Property Securities Equity Index Fund",
        symbol: "IWDP",
        isin: "IE00B1FZS350",
        justETFUrl: "https://www.justetf.com/it/etf-profile.html?isin=IE00B1FZS350",
        allocation: 8
      }
    ]
  }
];

async function seedLazyPortfolios() {
  try {
    console.log('🌱 Iniziando il seeding dei Lazy Portfolios...');

    // Prima elimina eventuali dati esistenti
    await db.delete(lazyPortfolioEtfs);
    await db.delete(lazyPortfolios);
    
    console.log('✅ Dati esistenti eliminati');

    for (const portfolioData of lazyPortfoliosData) {
      console.log(`📊 Inserendo portfolio: ${portfolioData.name}`);
      
      // Inserisci il portfolio
      const [portfolio] = await db.insert(lazyPortfolios).values({
        name: portfolioData.name,
        description: portfolioData.description,
        riskLevel: portfolioData.riskLevel,
        rebalancingFrequency: portfolioData.rebalancingFrequency,
        notes: portfolioData.notes,
        isActive: true
      }).returning();

      console.log(`  ✅ Portfolio inserito con ID: ${portfolio.id}`);

      // Inserisci gli ETF
      for (const etfData of portfolioData.etfs) {
        await db.insert(lazyPortfolioEtfs).values({
          lazyPortfolioId: portfolio.id,
          name: etfData.name,
          symbol: etfData.symbol,
          isin: etfData.isin,
          justETFUrl: etfData.justETFUrl,
          allocation: etfData.allocation
        });
        
        console.log(`    💰 ETF inserito: ${etfData.name} (${etfData.allocation}%)`);
      }
    }

    console.log('🎉 Seeding completato con successo!');
    console.log(`📈 Inseriti ${lazyPortfoliosData.length} portfolios con un totale di ${lazyPortfoliosData.reduce((sum, p) => sum + p.etfs.length, 0)} ETF`);

  } catch (error) {
    console.error('❌ Errore durante il seeding:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

// Esegui il seeding se questo script viene chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedLazyPortfolios();
}