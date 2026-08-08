const pool = require('./pool');

/**
 * Thin wrapper around pg.Pool.query so controllers don't import pg directly.
 * Returns the full pg result object (rows, rowCount, etc.).
 */
async function query(sql, params) {
  return pool.query(sql, params);
}

/**
 * Runs `fn(client)` inside a transaction (BEGIN/COMMIT/ROLLBACK).
 * `fn` receives the connected client to run its own queries with.
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { query, withTransaction };
