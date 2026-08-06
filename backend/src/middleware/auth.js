const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { query } = require('../db/query');

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.muro_token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Requires role: ${role}` });
    }
    next();
  };
}

async function isTortilleriaAccessible(userId, tortilleriaId) {
  const result = await query(
    'SELECT 1 FROM user_tortillerias WHERE user_id = $1 AND tortilleria_id = $2',
    [userId, tortilleriaId]
  );
  return result.rows.length > 0;
}

async function getUserTortilleriaIds(userId) {
  const result = await query(
    'SELECT tortilleria_id FROM user_tortillerias WHERE user_id = $1',
    [userId]
  );
  return result.rows.map((row) => row.tortilleria_id);
}

module.exports = { requireAuth, requireRole, isTortilleriaAccessible, getUserTortilleriaIds };
