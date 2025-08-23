// scripts/setup-database.js
import Database from 'better-sqlite3';
import path from 'path';

const databasePath = path.join(process.cwd(), 'database', 'portfolio.db');

console.log('🗄️ Creating database and tables...');

const db = new Database(databasePath);
db.pragma('journal_mode = WAL');

// Crea tabelle manualmente
console.log('📋 Creating tables...');

// Tabella Users
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

// Tabella Portfolios
db.exec(`
  CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    total_value REAL NOT NULL DEFAULT 0,
    total_profit REAL NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Tabella Assets
db.exec(`
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    isin TEXT,
    justetf_url TEXT,
    target_allocation REAL NOT NULL,
    current_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    current_value REAL NOT NULL,
    profit_loss REAL NOT NULL DEFAULT 0,
    current_allocation REAL NOT NULL DEFAULT 0,
    imbalance REAL NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
  );
`);

// Tabella Rebalancing History
db.exec(`
  CREATE TABLE IF NOT EXISTS rebalancing_history (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    action TEXT NOT NULL,
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    total_amount REAL NOT NULL,
    executed_by TEXT NOT NULL,
    date INTEGER NOT NULL,
    notes TEXT,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (executed_by) REFERENCES users(id)
  );
`);

// Tabella Audit Log
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

console.log('✅ All tables created successfully!');

// Verifica tabelle create
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('📊 Tables in database:', tables.map(t => t.name));

db.close();

console.log('🎉 Database setup completed!');
console.log('');
console.log('Now you can run: npm run db:seed');