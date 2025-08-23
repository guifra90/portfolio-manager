import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.js',
  out: './drizzle',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './database/portfolio.db',
  },
});