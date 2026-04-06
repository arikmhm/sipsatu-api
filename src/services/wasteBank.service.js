const { eq, and, sql } = require('drizzle-orm');
const db = require('../config/db');
const { wasteBanks, wastePrices, wasteCategories } = require('../db/schema');
const AppError = require('../utils/AppError');

exports.getAll = async () => {
  return db.select().from(wasteBanks).where(eq(wasteBanks.isActive, true));
};

exports.getById = async (id) => {
  const [bank] = await db.select().from(wasteBanks).where(eq(wasteBanks.id, id)).limit(1);

  if (!bank) {
    throw new AppError(404, 'Bank sampah tidak ditemukan');
  }

  // Get latest prices per category
  const prices = await db
    .select({
      category_id: wastePrices.categoryId,
      category_name: wasteCategories.name,
      unit: wasteCategories.unit,
      price_per_unit: wastePrices.pricePerUnit,
      effective_date: wastePrices.effectiveDate,
    })
    .from(wastePrices)
    .innerJoin(wasteCategories, eq(wastePrices.categoryId, wasteCategories.id))
    .where(
      and(
        eq(wastePrices.wasteBankId, id),
        eq(wasteCategories.isActive, true),
        eq(
          wastePrices.effectiveDate,
          db
            .select({ maxDate: sql`MAX(${wastePrices.effectiveDate})` })
            .from(wastePrices)
            .where(
              and(
                eq(wastePrices.wasteBankId, id),
                eq(wastePrices.categoryId, wasteCategories.id)
              )
            )
        )
      )
    );

  return { ...bank, prices };
};

exports.create = async (data) => {
  const [bank] = await db.insert(wasteBanks).values(data).returning();
  return bank;
};

exports.update = async (id, data) => {
  const [bank] = await db
    .update(wasteBanks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(wasteBanks.id, id))
    .returning();

  if (!bank) {
    throw new AppError(404, 'Bank sampah tidak ditemukan');
  }

  return bank;
};
