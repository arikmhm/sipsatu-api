# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SIPSATU (Sistem Informasi Pengelolaan Sampah Terpadu) — backend REST API for a kelurahan-level waste bank management system. Handles waste deposit recording, customer (nasabah) management, and payment transparency between waste banks and the community.

## Tech Stack

- **Runtime:** Node.js 20 LTS, plain JavaScript (no TypeScript)
- **Framework:** Express.js 4.x
- **ORM:** Drizzle ORM with `postgres` driver
- **Database:** PostgreSQL via Supabase
- **File Storage:** Supabase Storage (bucket: `payment-proofs`)
- **Auth:** JWT (`jsonwebtoken`) + bcryptjs
- **Validation:** Joi
- **File Upload:** Multer (memory storage, max 5MB, jpg/png only)

## Commands

```bash
npm run dev          # Start dev server with nodemon
npm start            # Start production server
npm run db:generate  # Generate Drizzle migration SQL
npm run db:migrate   # Run migrations
npm run db:push      # Push schema to Supabase (dev shortcut)
npm run db:seed      # Seed test data
```

## Architecture

Layered architecture — each layer only calls the layer directly below it:

```
Routes → Controllers → Services → Drizzle ORM → PostgreSQL/Supabase Storage
```

Middlewares (auth, role, validate, upload) run before controllers.

### Folder Structure

```
src/
├── config/          # db.js, supabase.js, env.js
├── db/              # schema.js (all 6 tables), migrate.js, seed.js
├── middlewares/      # auth.js, role.js, upload.js, validate.js, errorHandler.js
├── routes/          # [module].routes.js + index.js (registers all)
├── controllers/     # [module].controller.js
├── services/        # [module].service.js (all business logic here)
├── utils/           # response.js, depositCode.js, AppError.js
└── app.js           # Express setup
server.js            # Entry point
drizzle.config.js    # Drizzle Kit config
```

### File Naming Convention

- Routes: `[module].routes.js`
- Controllers: `[module].controller.js`
- Services: `[module].service.js`
- All lowercase, camelCase for multi-word modules

## Key Modules

8 modules: `auth`, `wasteBank`, `category`, `price`, `user`, `deposit`, `nasabah`, `upload`

## Database Schema

6 tables defined in `src/db/schema.js`:
- `users` — roles: `nasabah`, `petugas`, `admin` (each linked to a waste_bank_id)
- `wasteBanks` — waste bank locations
- `wasteCategories` — types of waste (plastik, kertas, logam, kaca, organik)
- `wastePrices` — price per category per waste bank (historized by effective_date)
- `deposits` — waste deposit transactions (status: `paid`/`unpaid`)
- `depositItems` — line items per deposit (weight, price snapshot, subtotal)

## Business Rules

- 1 nasabah = 1 waste bank (cannot register at multiple)
- Balance = SUM(total_value) of unpaid deposits (no stored balance column)
- Payment is per deposit, not per item
- Photo proof required for all payments (both instant and settlement)
- Prices are historized: new price doesn't overwrite old; latest effective_date wins
- Petugas can only access data within their own waste bank
- Deposit code format: `TRX-YYYYMMDD-XXX`

## API Conventions

- Base path: `/api`
- Auth: JWT Bearer token in `Authorization` header
- All responses use consistent format via `src/utils/response.js`:
  - Success: `{ success: true, message, data }`
  - Error: `{ success: false, message, errors: [{ field, message }] }`
  - Paginated: adds `pagination: { page, limit, total, total_pages }`
- Controllers: extract from req, call service, format response — no business logic
- Services: all business logic, validation, calculations, Supabase Storage uploads
- Async controllers use try/catch with `next(err)` to global `errorHandler`

## Role-Based Access

| Role | Scope |
|------|-------|
| `admin` | Full access, manages all waste banks/users/categories/prices |
| `petugas` | Input deposits, settle payments, search nasabah — only within own waste bank |
| `nasabah` | View own dashboard, deposit history, payment proofs |
| Public (no auth) | Landing page data, waste bank list/detail, register, login |

## Environment Variables

See `.env.example`. Key vars: `PORT`, `NODE_ENV`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET`, `JWT_SECRET`, `JWT_EXPIRES_IN`
