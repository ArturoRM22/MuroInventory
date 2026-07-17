const pool = require('./pool');

/**
 * Thin wrapper around pg.Pool.query so controllers don't import pg directly.
 * Returns the full pg result object (rows, rowCount, etc.).
 */
async function query(sql, params) {
  return pool.query(sql, params);
}

module.exports = { query };
