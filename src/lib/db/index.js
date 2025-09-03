// src/lib/db/index.js
import * as schema from './schema.js';
import path from 'path';

// Configurazione per ambiente
const isProduction = process.env.NODE_ENV === 'production';

let db;

if (isProduction) {
  // Configurazione Turso per produzione
  const { drizzle } = await import('drizzle-orm/libsql');
  const { createClient } = await import('@libsql/client');
  
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  db = drizzle(client, { schema });
} else {
  // Configurazione locale con better-sqlite3
  const Database = (await import('better-sqlite3')).default;
  const { drizzle } = await import('drizzle-orm/better-sqlite3');
  const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');

  const databasePath = path.join(process.cwd(), 'database', 'portfolio.db');
  
  const sqlite = new Database(databasePath);
  sqlite.pragma('journal_mode = WAL');
  
  db = drizzle(sqlite, { schema });

  // Auto-migrate in development - DISABLED to avoid conflicts
  // Migration already applied manually via drizzle-kit push:sqlite
  if (process.env.ENABLE_AUTO_MIGRATE === 'true') {
    try {
      const migrationsPath = path.join(process.cwd(), 'drizzle');
      migrate(db, { migrationsFolder: migrationsPath });
      console.log('✅ Database migrated successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      // Non bloccare l'app se le migrazioni falliscono
    }
  }
}

export { db };
export default db;