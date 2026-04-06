require('dotenv').config();
const bcrypt = require('bcryptjs');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const schema = require('./schema');

const client = postgres(process.env.DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

const { wasteBanks, users, wasteCategories, wastePrices, deposits, depositItems } = schema;

async function seed() {
  console.log('Clearing existing data...');
  await db.delete(depositItems);
  await db.delete(deposits);
  await db.delete(wastePrices);
  await db.delete(wasteCategories);
  await db.delete(users);
  await db.delete(wasteBanks);

  const hash = await bcrypt.hash('password123', 10);

  // === 2 Bank Sampah ===
  console.log('Seeding waste banks...');
  const [bank1] = await db.insert(wasteBanks).values({
    name: 'Bank Sampah Mawar',
    address: 'Jl. Mawar No. 10, RT 03/RW 05',
    kelurahan: 'Sukamaju',
    phone: '081234567890',
    operatingHours: 'Senin-Jumat 08:00-12:00',
    description: 'Bank sampah aktif sejak 2020, melayani warga RT 03-05',
  }).returning();

  const [bank2] = await db.insert(wasteBanks).values({
    name: 'Bank Sampah Melati',
    address: 'Jl. Melati No. 5, RT 01/RW 02',
    kelurahan: 'Sukamaju',
    phone: '081234567891',
    operatingHours: 'Senin-Sabtu 07:00-11:00',
    description: 'Bank sampah baru, dibuka tahun 2024',
  }).returning();

  // === 1 Admin, 2 Petugas, 5 Nasabah ===
  console.log('Seeding users...');
  const [admin] = await db.insert(users).values({
    name: 'Admin Kelurahan',
    phone: '08110000001',
    email: 'admin@sipsatu.id',
    passwordHash: hash,
    role: 'admin',
  }).returning();

  const [petugas1] = await db.insert(users).values({
    name: 'Pak Joko',
    phone: '08110000002',
    email: 'joko@sipsatu.id',
    passwordHash: hash,
    role: 'petugas',
    wasteBankId: bank1.id,
  }).returning();

  const [petugas2] = await db.insert(users).values({
    name: 'Bu Sari',
    phone: '08110000003',
    email: 'sari@sipsatu.id',
    passwordHash: hash,
    role: 'petugas',
    wasteBankId: bank2.id,
  }).returning();

  const nasabahs = [];
  const nasabahData = [
    { name: 'Budi Santoso', phone: '08220000001', email: 'budi@email.com', bankId: bank1.id },
    { name: 'Siti Aminah', phone: '08220000002', email: 'siti@email.com', bankId: bank1.id },
    { name: 'Agus Prasetyo', phone: '08220000003', email: 'agus@email.com', bankId: bank1.id },
    { name: 'Dewi Lestari', phone: '08220000004', email: 'dewi@email.com', bankId: bank2.id },
    { name: 'Rina Wati', phone: '08220000005', email: 'rina@email.com', bankId: bank2.id },
  ];

  for (const n of nasabahData) {
    const [user] = await db.insert(users).values({
      name: n.name,
      phone: n.phone,
      email: n.email,
      passwordHash: hash,
      role: 'nasabah',
      wasteBankId: n.bankId,
    }).returning();
    nasabahs.push(user);
  }

  // === 5 Kategori Sampah ===
  console.log('Seeding waste categories...');
  const categories = [];
  const catData = ['Plastik', 'Kertas', 'Logam', 'Kaca', 'Organik'];
  for (const name of catData) {
    const [cat] = await db.insert(wasteCategories).values({ name, unit: 'kg' }).returning();
    categories.push(cat);
  }

  // === Harga per kategori per bank ===
  console.log('Seeding waste prices...');
  const priceMap = {
    'Plastik': [3000, 3200],
    'Kertas': [2000, 2100],
    'Logam': [8000, 8500],
    'Kaca': [1500, 1600],
    'Organik': [500, 600],
  };

  for (const cat of categories) {
    const prices = priceMap[cat.name];
    await db.insert(wastePrices).values({
      wasteBankId: bank1.id,
      categoryId: cat.id,
      pricePerUnit: String(prices[0]),
      effectiveDate: '2026-04-01',
    });
    await db.insert(wastePrices).values({
      wasteBankId: bank2.id,
      categoryId: cat.id,
      pricePerUnit: String(prices[1]),
      effectiveDate: '2026-04-01',
    });
  }

  // === 10 Deposits ===
  console.log('Seeding deposits...');
  const depositData = [
    { nasabah: 0, bank: bank1, officer: petugas1, items: [{ cat: 0, w: 2.5 }, { cat: 1, w: 1.0 }], status: 'paid' },
    { nasabah: 0, bank: bank1, officer: petugas1, items: [{ cat: 2, w: 0.5 }], status: 'unpaid' },
    { nasabah: 1, bank: bank1, officer: petugas1, items: [{ cat: 0, w: 3.0 }, { cat: 4, w: 5.0 }], status: 'paid' },
    { nasabah: 1, bank: bank1, officer: petugas1, items: [{ cat: 1, w: 2.0 }], status: 'unpaid' },
    { nasabah: 2, bank: bank1, officer: petugas1, items: [{ cat: 3, w: 1.5 }, { cat: 0, w: 1.0 }], status: 'paid' },
    { nasabah: 2, bank: bank1, officer: petugas1, items: [{ cat: 2, w: 1.0 }], status: 'unpaid' },
    { nasabah: 3, bank: bank2, officer: petugas2, items: [{ cat: 0, w: 4.0 }, { cat: 1, w: 2.0 }], status: 'paid' },
    { nasabah: 3, bank: bank2, officer: petugas2, items: [{ cat: 2, w: 0.3 }], status: 'unpaid' },
    { nasabah: 4, bank: bank2, officer: petugas2, items: [{ cat: 4, w: 10.0 }], status: 'paid' },
    { nasabah: 4, bank: bank2, officer: petugas2, items: [{ cat: 0, w: 2.0 }, { cat: 3, w: 3.0 }], status: 'unpaid' },
  ];

  for (let i = 0; i < depositData.length; i++) {
    const d = depositData[i];
    const bankId = d.bank.id;

    let totalWeight = 0;
    let totalValue = 0;
    const itemValues = [];

    for (const item of d.items) {
      const cat = categories[item.cat];
      const prices = priceMap[cat.name];
      const price = bankId === bank1.id ? prices[0] : prices[1];
      const subtotal = item.w * price;
      totalWeight += item.w;
      totalValue += subtotal;
      itemValues.push({
        categoryId: cat.id,
        weight: String(item.w),
        pricePerUnit: String(price),
        subtotal: String(subtotal),
      });
    }

    const code = `TRX-20260401-${String(i + 1).padStart(3, '0')}`;
    const isPaid = d.status === 'paid';

    const [deposit] = await db.insert(deposits).values({
      depositCode: code,
      userId: nasabahs[d.nasabah].id,
      wasteBankId: bankId,
      officerId: d.officer.id,
      totalWeight: String(totalWeight),
      totalValue: String(totalValue),
      paymentStatus: d.status,
      paymentProofUrl: isPaid ? 'https://axivjlkntpmyesimxbxy.supabase.co/storage/v1/object/public/payment-proofs/seed-proof.jpg' : null,
      paidAt: isPaid ? new Date('2026-04-01T10:00:00Z') : null,
    }).returning();

    await db.insert(depositItems).values(
      itemValues.map((v) => ({ ...v, depositId: deposit.id }))
    );
  }

  console.log('\nSeed completed!');
  console.log('  2 bank sampah');
  console.log('  8 users (1 admin, 2 petugas, 5 nasabah)');
  console.log('  5 kategori sampah');
  console.log('  10 harga (5 kategori x 2 bank)');
  console.log('  10 deposits (5 paid, 5 unpaid)');
  console.log('\nLogin credentials (all passwords: password123):');
  console.log('  Admin:    08110000001 / admin@sipsatu.id');
  console.log('  Petugas1: 08110000002 / joko@sipsatu.id (Bank Mawar)');
  console.log('  Petugas2: 08110000003 / sari@sipsatu.id (Bank Melati)');
  console.log('  Nasabah:  08220000001-05');

  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
