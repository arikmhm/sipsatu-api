const { eq, and, sql } = require('drizzle-orm');
const db = require('../config/db');
const { users, wasteBanks, deposits } = require('../db/schema');
const AppError = require('../utils/AppError');

exports.getDashboard = async (userId) => {
  const [user] = await db
    .select({
      name: users.name,
      waste_bank_name: wasteBanks.name,
    })
    .from(users)
    .leftJoin(wasteBanks, eq(users.wasteBankId, wasteBanks.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new AppError(404, 'User tidak ditemukan');
  }

  const [stats] = await db
    .select({
      balance: sql`COALESCE(SUM(CASE WHEN ${deposits.paymentStatus} = 'unpaid' THEN ${deposits.totalValue} ELSE 0 END), 0)`,
      total_deposits: sql`COUNT(*)`,
      total_weight: sql`COALESCE(SUM(${deposits.totalWeight}), 0)`,
    })
    .from(deposits)
    .where(eq(deposits.userId, userId));

  return {
    name: user.name,
    waste_bank_name: user.waste_bank_name,
    balance: Number(stats.balance),
    total_deposits: Number(stats.total_deposits),
    total_weight: Number(stats.total_weight),
  };
};
