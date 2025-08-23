// src/lib/db/index.js
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.js';
import path from 'path';

const databasePath = path.join(process.cwd(), 'database', 'portfolio.db');

const sqlite = new Database(databasePath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// Auto-migrate in development
if (process.env.NODE_ENV === 'development') {
  try {
    migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Database migrated successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

export default db;