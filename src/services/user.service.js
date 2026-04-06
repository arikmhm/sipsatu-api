const bcrypt = require('bcryptjs');
const { eq, and, or, like, sql, count } = require('drizzle-orm');
const db = require('../config/db');
const { users, wasteBanks, deposits } = require('../db/schema');
const AppError = require('../utils/AppError');

exports.getAll = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.waste_bank_id) conditions.push(eq(users.wasteBankId, query.waste_bank_id));
  if (query.role) conditions.push(eq(users.role, query.role));
  if (query.search) {
    conditions.push(
      or(
        like(users.name, `%${query.search}%`),
        like(users.phone, `%${query.search}%`)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        role: users.role,
        waste_bank_id: users.wasteBankId,
        waste_bank_name: wasteBanks.name,
        created_at: users.createdAt,
      })
      .from(users)
      .leftJoin(wasteBanks, eq(users.wasteBankId, wasteBanks.id))
      .where(where)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(users).where(where),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(total),
      total_pages: Math.ceil(Number(total) / limit),
    },
  };
};

exports.getById = async (id) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      email: users.email,
      role: users.role,
      waste_bank_id: users.wasteBankId,
      waste_bank_name: wasteBanks.name,
      created_at: users.createdAt,
    })
    .from(users)
    .leftJoin(wasteBanks, eq(users.wasteBankId, wasteBanks.id))
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    throw new AppError(404, 'User tidak ditemukan');
  }

  // Calculate balance (sum of unpaid deposits)
  const [{ balance }] = await db
    .select({ balance: sql`COALESCE(SUM(${deposits.totalValue}), 0)` })
    .from(deposits)
    .where(and(eq(deposits.userId, id), eq(deposits.paymentStatus, 'unpaid')));

  return { ...user, balance: Number(balance) };
};

exports.create = async (data) => {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.phone, data.phone), data.email ? eq(users.email, data.email) : undefined))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError(400, 'Phone atau email sudah terdaftar');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      passwordHash,
      role: data.role,
      wasteBankId: data.waste_bank_id,
    })
    .returning();

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    waste_bank_id: user.wasteBankId,
    created_at: user.createdAt,
  };
};

exports.searchNasabah = async (keyword, wasteBankId) => {
  if (!keyword) {
    throw new AppError(400, 'Parameter q wajib diisi');
  }

  const results = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
    })
    .from(users)
    .where(
      and(
        eq(users.role, 'nasabah'),
        eq(users.wasteBankId, wasteBankId),
        or(
          like(users.name, `%${keyword}%`),
          like(users.phone, `%${keyword}%`)
        )
      )
    );

  // Calculate balance per nasabah
  const data = await Promise.all(
    results.map(async (u) => {
      const [{ balance }] = await db
        .select({ balance: sql`COALESCE(SUM(${deposits.totalValue}), 0)` })
        .from(deposits)
        .where(and(eq(deposits.userId, u.id), eq(deposits.paymentStatus, 'unpaid')));
      return { ...u, balance: Number(balance) };
    })
  );

  return data;
};
