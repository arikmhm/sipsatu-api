const { eq, and, sql } = require('drizzle-orm');
const db = require('../config/db');
const { wastePrices, wasteCategories } = require('../db/schema');
const AppError = require('../utils/AppError');

exports.getLatest = async (wasteBankId) => {
  if (!wasteBankId) {
    throw new AppError(400, 'waste_bank_id wajib diisi');
  }

  return db
    .select({
      id: wastePrices.id,
      waste_bank_id: wastePrices.wasteBankId,
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
        eq(wastePrices.wasteBankId, wasteBankId),
        eq(
          wastePrices.effectiveDate,
          db
            .select({ maxDate: sql`MAX(${wastePrices.effectiveDate})` })
            .from(wastePrices)
            .where(
              and(
                eq(wastePrices.wasteBankId, wasteBankId),
                eq(wastePrices.categoryId, wasteCategories.id)
              )
            )
        )
      )
    );
};

exports.create = async (data) => {
  const [price] = await db.insert(wastePrices).values({
    wasteBankId: data.waste_bank_id,
    categoryId: data.category_id,
    pricePerUnit: data.price_per_unit,
    effectiveDate: data.effective_date || new Date().toISOString().split('T')[0],
  }).returning();

  return price;
};
