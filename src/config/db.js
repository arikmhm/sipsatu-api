const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const env = require('./env');

const client = postgres(env.DATABASE_URL, { prepare: false });
const db = drizzle(client);

module.exports = db;
