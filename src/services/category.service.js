const { eq } = require('drizzle-orm');
const db = require('../config/db');
const { wasteCategories } = require('../db/schema');
const AppError = require('../utils/AppError');

exports.getAll = async () => {
  return db.select().from(wasteCategories).where(eq(wasteCategories.isActive, true));
};

exports.create = async (data) => {
  const [category] = await db.insert(wasteCategories).values(data).returning();
  return category;
};

exports.update = async (id, data) => {
  const [category] = await db
    .update(wasteCategories)
    .set(data)
    .where(eq(wasteCategories.id, id))
    .returning();

  if (!category) {
    throw new AppError(404, 'Kategori tidak ditemukan');
  }

  return category;
};
