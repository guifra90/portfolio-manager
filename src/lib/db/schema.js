// src/lib/db/schema.js
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

// Tabella Users con ruoli
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Tabella Portfolios
export const portfolios = sqliteTable('portfolios', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  totalValue: real('total_value').notNull().default(0),
  totalProfit: real('total_profit').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Tabella Assets
export const assets = sqliteTable('assets', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  portfolioId: text('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  isin: text('isin'),
  justETFUrl: text('justetf_url'),
  targetAllocation: real('target_allocation').notNull(),
  currentPrice: real('current_price').notNull(),
  averagePurchasePrice: real('average_purchase_price').notNull().default(0),
  quantity: integer('quantity').notNull(),
  currentValue: real('current_value').notNull(),
  purchaseValue: real('purchase_value').notNull().default(0),
  profitLoss: real('profit_loss').notNull().default(0),
  profitLossPercentage: real('profit_loss_percentage').notNull().default(0),
  currentAllocation: real('current_allocation').notNull().default(0),
  imbalance: real('imbalance').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Tabella Rebalancing History
export const rebalancingHistory = sqliteTable('rebalancing_history', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  portfolioId: text('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  assetId: text('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // 'BUY' | 'SELL'
  quantity: real('quantity').notNull(),
  price: real('price').notNull(),
  totalAmount: real('total_amount').notNull(),
  executedBy: text('executed_by').notNull().references(() => users.id),
  date: integer('date', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  notes: text('notes'),
});

// Tabella Audit Log per admin
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  targetType: text('target_type').notNull(), // 'USER', 'PORTFOLIO', 'ASSET'
  targetId: text('target_id'),
  details: text('details'), // JSON string
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Tabella Password Reset Tokens
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});