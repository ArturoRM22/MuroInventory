const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS } = require('../config');
const { query } = require('../db/query');
const { isNonEmptyString, isOneOf, collectErrors } = require('../utils/validation');

const COOKIE_NAME = 'muro_token';

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function setTokenCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: msFromJWT(JWT_EXPIRES_IN),
    path: '/',
  });
}

function msFromJWT(expiresIn) {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) return 24 * 60 * 60 * 1000; // default 24h
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] || multipliers.d);
}

async function register(req, res, next) {
  try {
    const { name, password, role } = req.body || {};

    const errors = collectErrors({
      name: isNonEmptyString(name),
      password: isNonEmptyString(password),
      role: isOneOf(role, ['manager', 'user']),
    });

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const dup = await query('SELECT id FROM users WHERE name = $1', [name.trim()]);
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await query(
      'INSERT INTO users (name, password, role) VALUES ($1, $2, $3) RETURNING id, name, role',
      [name.trim(), hash, role]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { name, password } = req.body || {};

    const errors = collectErrors({
      name: isNonEmptyString(name),
      password: isNonEmptyString(password),
    });

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const result = await query(
      'SELECT id, name, role, password FROM users WHERE name = $1',
      [name.trim()]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    setTokenCookie(res, token);

    return res.json({ name: user.name, role: user.role });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res) {
  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return res.json({ ok: true });
}

module.exports = { register, login, logout };
