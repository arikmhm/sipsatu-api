const {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  decimal,
  timestamp,
  date,
  pgEnum,
  unique,
} = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// Enums
const roleEnum = pgEnum('role', ['nasabah', 'petugas', 'admin']);
const paymentStatusEnum = pgEnum('payment_status', ['paid', 'unpaid']);

// ============ Tables ============

const wasteBanks = pgTable('waste_banks', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  kelurahan: varchar('kelurahan', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  operatingHours: varchar('operating_hours', { length: 255 }),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull(),
  wasteBankId: uuid('waste_bank_id').references(() => wasteBanks.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const wasteCategories = pgTable('waste_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  unit: varchar('unit', { length: 50 }).default('kg'),
  isActive: boolean('is_active').default(true),
});

const wastePrices = pgTable(
  'waste_prices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    wasteBankId: uuid('waste_bank_id')
      .notNull()
      .references(() => wasteBanks.id),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => wasteCategories.id),
    pricePerUnit: decimal('price_per_unit', { precision: 12, scale: 2 }).notNull(),
    effectiveDate: date('effective_date').defaultNow(),
  },
  (table) => [
    unique('waste_prices_unique').on(table.wasteBankId, table.categoryId, table.effectiveDate),
  ]
);

const deposits = pgTable('deposits', {
  id: uuid('id').defaultRandom().primaryKey(),
  depositCode: varchar('deposit_code', { length: 20 }).notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  wasteBankId: uuid('waste_bank_id')
    .notNull()
    .references(() => wasteBanks.id),
  officerId: uuid('officer_id')
    .notNull()
    .references(() => users.id),
  totalWeight: decimal('total_weight', { precision: 12, scale: 2 }).default('0'),
  totalValue: decimal('total_value', { precision: 12, scale: 2 }).default('0'),
  paymentStatus: paymentStatusEnum('payment_status').default('unpaid'),
  paymentProofUrl: varchar('payment_proof_url', { length: 500 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

const depositItems = pgTable('deposit_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  depositId: uuid('deposit_id')
    .notNull()
    .references(() => deposits.id),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => wasteCategories.id),
  weight: decimal('weight', { precision: 12, scale: 2 }).notNull(),
  pricePerUnit: decimal('price_per_unit', { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
});

// ============ Relations ============

const wasteBanksRelations = relations(wasteBanks, ({ many }) => ({
  users: many(users),
  wastePrices: many(wastePrices),
  deposits: many(deposits),
}));

const usersRelations = relations(users, ({ one, many }) => ({
  wasteBank: one(wasteBanks, {
    fields: [users.wasteBankId],
    references: [wasteBanks.id],
  }),
  deposits: many(deposits, { relationName: 'nasabahDeposits' }),
  officerDeposits: many(deposits, { relationName: 'officerDeposits' }),
}));

const wasteCategoriesRelations = relations(wasteCategories, ({ many }) => ({
  wastePrices: many(wastePrices),
  depositItems: many(depositItems),
}));

const wastePricesRelations = relations(wastePrices, ({ one }) => ({
  wasteBank: one(wasteBanks, {
    fields: [wastePrices.wasteBankId],
    references: [wasteBanks.id],
  }),
  category: one(wasteCategories, {
    fields: [wastePrices.categoryId],
    references: [wasteCategories.id],
  }),
}));

const depositsRelations = relations(deposits, ({ one, many }) => ({
  user: one(users, {
    fields: [deposits.userId],
    references: [users.id],
    relationName: 'nasabahDeposits',
  }),
  officer: one(users, {
    fields: [deposits.officerId],
    references: [users.id],
    relationName: 'officerDeposits',
  }),
  wasteBank: one(wasteBanks, {
    fields: [deposits.wasteBankId],
    references: [wasteBanks.id],
  }),
  items: many(depositItems),
}));

const depositItemsRelations = relations(depositItems, ({ one }) => ({
  deposit: one(deposits, {
    fields: [depositItems.depositId],
    references: [deposits.id],
  }),
  category: one(wasteCategories, {
    fields: [depositItems.categoryId],
    references: [wasteCategories.id],
  }),
}));

module.exports = {
  roleEnum,
  paymentStatusEnum,
  wasteBanks,
  users,
  wasteCategories,
  wastePrices,
  deposits,
  depositItems,
  wasteBanksRelations,
  usersRelations,
  wasteCategoriesRelations,
  wastePricesRelations,
  depositsRelations,
  depositItemsRelations,
};
