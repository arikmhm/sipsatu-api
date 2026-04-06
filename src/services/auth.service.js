const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { eq, or } = require('drizzle-orm');
const db = require('../config/db');
const { users, wasteBanks } = require('../db/schema');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, waste_bank_id: user.wasteBankId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

exports.register = async (data) => {
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
      role: 'nasabah',
      wasteBankId: data.waste_bank_id,
    })
    .returning();

  const token = generateToken(user);

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    waste_bank_id: user.wasteBankId,
    token,
  };
};

exports.login = async (data) => {
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.phone, data.login), eq(users.email, data.login)))
    .limit(1);

  if (!user) {
    throw new AppError(401, 'Phone/email atau password salah');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Phone/email atau password salah');
  }

  const token = generateToken(user);

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    waste_bank_id: user.wasteBankId,
    token,
  };
};

exports.getProfile = async (userId) => {
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
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new AppError(404, 'User tidak ditemukan');
  }

  return user;
};
