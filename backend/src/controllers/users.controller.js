const { query } = require('../db/query');

async function listUsers(req, res, next) {
  try {
    const result = await query(
      `SELECT id, name, role
       FROM users
       WHERE role IN ('admin', 'user')
       ORDER BY name ASC`
    );
    return res.json({ data: result.rows });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listUsers };
