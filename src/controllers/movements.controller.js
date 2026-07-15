const { query } = require('../db/query');
const {
  isISODate,
  isNonEmptyString,
  isNonNegativeInteger,
  isOneOf,
  isId,
  collectErrors,
} = require('../utils/validation');

const MOVEMENT_TYPES = ['llegada', 'uso'];

async function listMovements(req, res, next) {
  try {
    const { from, to, tortilleria_id } = req.query;

    const conditions = [];
    const values = [];

    if (from) {
      const err = isISODate(from);
      if (err) return res.status(400).json({ error: 'Invalid from date', details: { from: err } });
      conditions.push(`day >= $${conditions.length + 1}`);
      values.push(from);
    }

    if (to) {
      const err = isISODate(to);
      if (err) return res.status(400).json({ error: 'Invalid to date', details: { to: err } });
      conditions.push(`day <= $${conditions.length + 1}`);
      values.push(to);
    }

    if (tortilleria_id) {
      const err = isId(tortilleria_id);
      if (err) {
        return res.status(400).json({
          error: 'Invalid tortilleria_id',
          details: { tortilleria_id: err },
        });
      }
      conditions.push(`tortilleria_id = $${conditions.length + 1}`);
      values.push(tortilleria_id);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT id, day, type, sacks, tortilleria_id, employee_name, created_by, created_at
                 FROM movements
                 ${whereClause}
                 ORDER BY day DESC, created_at DESC`;

    const result = await query(sql, values);
    return res.json({ data: result.rows });
  } catch (err) {
    return next(err);
  }
}

async function createMovement(req, res, next) {
  try {
    const { day, type, sacks, tortilleria_id, employee_name } = req.body || {};

    const errors = collectErrors({
      day: isISODate(day),
      type: isOneOf(type, MOVEMENT_TYPES),
      sacks: isNonNegativeInteger(sacks),
      tortilleria_id: isId(tortilleria_id),
      employee_name: isNonEmptyString(employee_name),
    });

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Per spec, movements always reference the main tortilleria.
    const tortResult = await query('SELECT is_main, initial_stock FROM tortillerias WHERE id = $1', [
      tortilleria_id,
    ]);
    if (tortResult.rows.length === 0) {
      return res.status(400).json({ error: 'tortilleria_id does not exist' });
    }
    if (!tortResult.rows[0].is_main) {
      return res.status(400).json({
        error: 'movements can only be recorded against the main tortilleria',
      });
    }

    if (type === 'uso') {
      const stockResult = await query(
        `SELECT t.initial_stock
              + COALESCE(SUM(CASE WHEN m.type = 'llegada' THEN m.sacks ELSE -m.sacks END), 0) AS current_stock
         FROM tortillerias t
         LEFT JOIN movements m ON m.tortilleria_id = t.id AND m.day <= $1
         WHERE t.id = $2
         GROUP BY t.id`,
        [day, tortilleria_id]
      );

      const current = parseInt(stockResult.rows[0].current_stock, 10);
      if (sacks > current) {
        return res.status(400).json({
          error: `insufficient stock: available ${current}, requested ${sacks}`,
        });
      }
    }

    const result = await query(
      `INSERT INTO movements (day, type, sacks, tortilleria_id, employee_name, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, day, type, sacks, tortilleria_id, employee_name, created_by, created_at`,
      [day, type, sacks, tortilleria_id, employee_name.trim(), req.user.sub]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

async function deleteMovement(req, res, next) {
  try {
    const idErr = isId(req.params.id);
    if (idErr) {
      return res.status(400).json({ error: 'Invalid movement id', details: { id: idErr } });
    }

    const result = await query('DELETE FROM movements WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movement not found' });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { listMovements, createMovement, deleteMovement };
