const { eq, and, like, count } = require('drizzle-orm');
const db = require('../config/db');
const { deposits } = require('../db/schema');

const generateDepositCode = async () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const prefix = `TRX-${dateStr}-`;

  const [{ total }] = await db
    .select({ total: count() })
    .from(deposits)
    .where(like(deposits.depositCode, `${prefix}%`));

  const seq = String(Number(total) + 1).padStart(3, '0');
  return `${prefix}${seq}`;
};

module.exports = generateDepositCode;
