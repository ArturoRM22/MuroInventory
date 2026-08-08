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

function requireAnyRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires one of roles: ${roles.join(', ')}` });
    }
    next();
  };
}

async function isTortilleriaAccessible(user, tortilleriaId) {
  if (user.role === 'super') return true;
  const result = await query(
    'SELECT 1 FROM user_tortillerias WHERE user_id = $1 AND tortilleria_id = $2',
    [user.sub, tortilleriaId]
  );
  return result.rows.length > 0;
}

async function getUserTortilleriaIds(user) {
  if (user.role === 'super') {
    const result = await query('SELECT id FROM tortillerias');
    return result.rows.map((row) => row.id);
  }
  const result = await query(
    'SELECT tortilleria_id FROM user_tortillerias WHERE user_id = $1',
    [user.sub]
  );
  return result.rows.map((row) => row.tortilleria_id);
}

module.exports = { requireAuth, requireRole, requireAnyRole, isTortilleriaAccessible, getUserTortilleriaIds };
