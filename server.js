const env = require('./src/config/env');
const app = require('./src/app');
const db = require('./src/config/db');
const { sql } = require('drizzle-orm');

db.execute(sql`SELECT 1`)
  .then(() => {
    console.log('Database connected');
    app.listen(env.PORT, () => {
      console.log(`SIPSATU API running on port ${env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
