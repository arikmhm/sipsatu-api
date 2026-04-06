const { eq, and, sql, between, count } = require('drizzle-orm');
const db = require('../config/db');
const { deposits, depositItems, users, wasteBanks, wasteCategories, wastePrices } = require('../db/schema');
const AppError = require('../utils/AppError');
const generateDepositCode = require('../utils/depositCode');

exports.create = async (data, officer) => {
  // Verify nasabah belongs to same waste bank
  const [nasabah] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, data.user_id), eq(users.role, 'nasabah')))
    .limit(1);

  if (!nasabah) {
    throw new AppError(404, 'Nasabah tidak ditemukan');
  }

  if (nasabah.wasteBankId !== officer.waste_bank_id) {
    throw new AppError(403, 'Nasabah bukan dari bank sampah yang sama');
  }

  // Lookup latest prices and calculate totals
  let totalWeight = 0;
  let totalValue = 0;
  const itemsWithPrice = [];

  for (const item of data.items) {
    const [price] = await db
      .select()
      .from(wastePrices)
      .where(
        and(
          eq(wastePrices.wasteBankId, officer.waste_bank_id),
          eq(wastePrices.categoryId, item.category_id)
        )
      )
      .orderBy(sql`${wastePrices.effectiveDate} DESC`)
      .limit(1);

    if (!price) {
      throw new AppError(400, `Harga belum ditetapkan untuk kategori ${item.category_id}`);
    }

    const subtotal = parseFloat(item.weight) * parseFloat(price.pricePerUnit);
    totalWeight += parseFloat(item.weight);
    totalValue += subtotal;

    itemsWithPrice.push({
      categoryId: item.category_id,
      weight: item.weight,
      pricePerUnit: price.pricePerUnit,
      subtotal: subtotal.toFixed(2),
    });
  }

  const depositCode = await generateDepositCode();

  // Check if paying immediately
  const isPaid = data.payment_status === 'paid';
  if (isPaid && !data.payment_proof_url) {
    throw new AppError(400, 'Bukti bayar wajib diisi jika status paid');
  }

  // Insert deposit + items in transaction
  const result = await db.transaction(async (tx) => {
    const [deposit] = await tx
      .insert(deposits)
      .values({
        depositCode,
        userId: data.user_id,
        wasteBankId: officer.waste_bank_id,
        officerId: officer.id,
        totalWeight: totalWeight.toFixed(2),
        totalValue: totalValue.toFixed(2),
        paymentStatus: isPaid ? 'paid' : 'unpaid',
        paymentProofUrl: isPaid ? data.payment_proof_url : null,
        paidAt: isPaid ? new Date() : null,
      })
      .returning();

    const items = await tx
      .insert(depositItems)
      .values(itemsWithPrice.map((item) => ({ ...item, depositId: deposit.id })))
      .returning();

    return { deposit, items };
  });

  return formatDeposit(result.deposit, result.items);
};

exports.getAll = async (query, user) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const offset = (page - 1) * limit;

  const conditions = [];

  // Role-based filtering
  if (user.role === 'petugas') {
    conditions.push(eq(deposits.wasteBankId, user.waste_bank_id));
  } else if (user.role === 'nasabah') {
    conditions.push(eq(deposits.userId, user.id));
  } else if (user.role === 'admin' && query.waste_bank_id) {
    conditions.push(eq(deposits.wasteBankId, query.waste_bank_id));
  }

  if (query.payment_status) {
    conditions.push(eq(deposits.paymentStatus, query.payment_status));
  }

  if (query.start_date && query.end_date) {
    conditions.push(between(deposits.createdAt, new Date(query.start_date), new Date(query.end_date + 'T23:59:59')));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: deposits.id,
        deposit_code: deposits.depositCode,
        user_name: users.name,
        waste_bank_name: wasteBanks.name,
        total_weight: deposits.totalWeight,
        total_value: deposits.totalValue,
        payment_status: deposits.paymentStatus,
        payment_proof_url: deposits.paymentProofUrl,
        paid_at: deposits.paidAt,
        created_at: deposits.createdAt,
      })
      .from(deposits)
      .innerJoin(users, eq(deposits.userId, users.id))
      .innerJoin(wasteBanks, eq(deposits.wasteBankId, wasteBanks.id))
      .where(where)
      .orderBy(sql`${deposits.createdAt} DESC`)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(deposits).where(where),
  ]);

  return {
    data,
    pagination: { page, limit, total: Number(total), total_pages: Math.ceil(Number(total) / limit) },
  };
};

exports.getById = async (id, user) => {
  const [deposit] = await db
    .select({
      id: deposits.id,
      deposit_code: deposits.depositCode,
      user_id: deposits.userId,
      user_name: users.name,
      waste_bank_id: deposits.wasteBankId,
      waste_bank_name: wasteBanks.name,
      officer_id: deposits.officerId,
      total_weight: deposits.totalWeight,
      total_value: deposits.totalValue,
      payment_status: deposits.paymentStatus,
      payment_proof_url: deposits.paymentProofUrl,
      paid_at: deposits.paidAt,
      created_at: deposits.createdAt,
    })
    .from(deposits)
    .innerJoin(users, eq(deposits.userId, users.id))
    .innerJoin(wasteBanks, eq(deposits.wasteBankId, wasteBanks.id))
    .where(eq(deposits.id, id))
    .limit(1);

  if (!deposit) {
    throw new AppError(404, 'Deposit tidak ditemukan');
  }

  // Access control
  if (user.role === 'petugas' && deposit.waste_bank_id !== user.waste_bank_id) {
    throw new AppError(403, 'Anda tidak memiliki akses');
  }
  if (user.role === 'nasabah' && deposit.user_id !== user.id) {
    throw new AppError(403, 'Anda tidak memiliki akses');
  }

  const items = await db
    .select({
      id: depositItems.id,
      category_name: wasteCategories.name,
      unit: wasteCategories.unit,
      weight: depositItems.weight,
      price_per_unit: depositItems.pricePerUnit,
      subtotal: depositItems.subtotal,
    })
    .from(depositItems)
    .innerJoin(wasteCategories, eq(depositItems.categoryId, wasteCategories.id))
    .where(eq(depositItems.depositId, id));

  // Remove officer_id for nasabah
  const result = { ...deposit, items };
  if (user.role === 'nasabah') {
    delete result.officer_id;
  }

  return result;
};

exports.getToday = async (officer) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return db
    .select({
      id: deposits.id,
      deposit_code: deposits.depositCode,
      user_name: users.name,
      total_weight: deposits.totalWeight,
      total_value: deposits.totalValue,
      payment_status: deposits.paymentStatus,
      created_at: deposits.createdAt,
    })
    .from(deposits)
    .innerJoin(users, eq(deposits.userId, users.id))
    .where(
      and(
        eq(deposits.officerId, officer.id),
        between(deposits.createdAt, todayStart, todayEnd)
      )
    )
    .orderBy(sql`${deposits.createdAt} DESC`);
};

exports.pay = async (id, paymentProofUrl, officer) => {
  const [deposit] = await db
    .select()
    .from(deposits)
    .where(eq(deposits.id, id))
    .limit(1);

  if (!deposit) {
    throw new AppError(404, 'Deposit tidak ditemukan');
  }

  if (deposit.paymentStatus === 'paid') {
    throw new AppError(400, 'Deposit sudah berstatus paid');
  }

  if (deposit.wasteBankId !== officer.waste_bank_id) {
    throw new AppError(403, 'Deposit bukan dari bank sampah Anda');
  }

  if (!paymentProofUrl) {
    throw new AppError(400, 'Bukti bayar wajib diupload');
  }

  const [updated] = await db
    .update(deposits)
    .set({
      paymentStatus: 'paid',
      paymentProofUrl,
      paidAt: new Date(),
    })
    .where(eq(deposits.id, id))
    .returning();

  return {
    id: updated.id,
    deposit_code: updated.depositCode,
    payment_status: updated.paymentStatus,
    payment_proof_url: updated.paymentProofUrl,
    paid_at: updated.paidAt,
  };
};

function formatDeposit(deposit, items) {
  return {
    id: deposit.id,
    deposit_code: deposit.depositCode,
    user_id: deposit.userId,
    waste_bank_id: deposit.wasteBankId,
    officer_id: deposit.officerId,
    total_weight: deposit.totalWeight,
    total_value: deposit.totalValue,
    payment_status: deposit.paymentStatus,
    payment_proof_url: deposit.paymentProofUrl,
    paid_at: deposit.paidAt,
    created_at: deposit.createdAt,
    items: items.map((i) => ({
      id: i.id,
      category_id: i.categoryId,
      weight: i.weight,
      price_per_unit: i.pricePerUnit,
      subtotal: i.subtotal,
    })),
  };
}
