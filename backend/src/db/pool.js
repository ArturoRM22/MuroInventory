const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  options: `-c TimeZone=${config.DB_TIMEZONE}`,
  ssl: process.env.NODE_ENV === 'prod' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
