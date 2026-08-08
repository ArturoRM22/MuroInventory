const { randomUUID } = require('node:crypto');
const { query, withTransaction } = require('../db/query');
const {
  isISODate,
  isNonEmptyString,
  isNonNegativeInteger,
  isOneOf,
  isId,
  collectErrors,
} = require('../utils/validation');
const { isTortilleriaAccessible, getUserTortilleriaIds } = require('../middleware/auth');

const MOVEMENT_TYPES = ['llegada', 'uso', 'salida'];

async function getCurrentStock(tortilleriaId, day) {
  const result = await query(
    `SELECT t.initial_stock
          + COALESCE(SUM(CASE WHEN m.type = 'llegada' THEN m.sacks ELSE -m.sacks END), 0) AS current_stock
     FROM tortillerias t
     LEFT JOIN movements m ON m.tortilleria_id = t.id AND m.day <= $1
     WHERE t.id = $2
     GROUP BY t.id`,
    [day, tortilleriaId]
  );
  return parseInt(result.rows[0].current_stock, 10);
}

async function listMovements(req, res, next) {
  try {
    const { from, to, day, tortilleria_id } = req.query;

    const conditions = [];
    const values = [];

    if (day) {
      const err = isISODate(day);
      if (err) return res.status(400).json({ error: 'Invalid day date', details: { day: err } });
      conditions.push(`m.day = $${conditions.length + 1}`);
      values.push(day);
    }

    if (from) {
      const err = isISODate(from);
      if (err) return res.status(400).json({ error: 'Invalid from date', details: { from: err } });
      conditions.push(`m.day >= $${conditions.length + 1}`);
      values.push(from);
    }

    if (to) {
      const err = isISODate(to);
      if (err) return res.status(400).json({ error: 'Invalid to date', details: { to: err } });
      conditions.push(`m.day <= $${conditions.length + 1}`);
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
      if (!(await isTortilleriaAccessible(req.user, Number(tortilleria_id)))) {
        return res.status(403).json({ error: 'You do not have access to this tortilleria' });
      }
      conditions.push(`m.tortilleria_id = $${conditions.length + 1}`);
      values.push(tortilleria_id);
    } else {
      const ids = await getUserTortilleriaIds(req.user);
      if (ids.length === 0) {
        return res.json({ data: [] });
      }
      conditions.push(`m.tortilleria_id = ANY($${conditions.length + 1}::int[])`);
      values.push(ids);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT m.id, m.day::text AS day, m.type, m.sacks, m.tortilleria_id,
                        m.destination_tortilleria_id, d.name AS destination_name,
                        m.employee_name, m.created_by, m.created_at
                 FROM movements m
                 LEFT JOIN tortillerias d ON d.id = m.destination_tortilleria_id
                 ${whereClause}
                 ORDER BY m.day DESC, m.created_at DESC`;

    const result = await query(sql, values);
    return res.json({ data: result.rows });
  } catch (err) {
    return next(err);
  }
}

async function createMovement(req, res, next) {
  try {
    const {
      day,
      type,
      sacks,
      tortilleria_id,
      employee_name,
      destination_tortilleria_id,
    } = req.body || {};

    const errors = collectErrors({
      day: isISODate(day),
      type: isOneOf(type, MOVEMENT_TYPES),
      sacks: isNonNegativeInteger(sacks),
      tortilleria_id: isId(tortilleria_id),
      employee_name: isNonEmptyString(employee_name),
      destination_tortilleria_id: type === 'salida' ? isId(destination_tortilleria_id) : null,
    });

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    if (!(await isTortilleriaAccessible(req.user, Number(tortilleria_id)))) {
      return res.status(403).json({ error: 'You do not have access to this tortilleria' });
    }

    const tortResult = await query('SELECT id, is_main FROM tortillerias WHERE id = $1', [
      tortilleria_id,
    ]);
    if (tortResult.rows.length === 0) {
      return res.status(400).json({ error: 'tortilleria_id does not exist' });
    }
    const isMain = tortResult.rows[0].is_main;

    if (!isMain && type === 'llegada') {
      return res.status(400).json({
        error: 'arrivals to a secondary tortilleria can only come from a salida of the main tortilleria',
      });
    }
    if (!isMain && type === 'salida') {
      return res.status(400).json({
        error: 'salidas can only be recorded against the main tortilleria',
      });
    }

    if (type === 'salida') {
      const destResult = await query(
        'SELECT id, is_main, main_tortilleria_id FROM tortillerias WHERE id = $1',
        [destination_tortilleria_id]
      );
      if (destResult.rows.length === 0) {
        return res.status(400).json({ error: 'destination_tortilleria_id does not exist' });
      }
      const dest = destResult.rows[0];
      if (dest.is_main) {
        return res.status(400).json({
          error: 'salidas can only be sent to a secondary tortilleria',
        });
      }
      if (dest.main_tortilleria_id !== tortilleria_id) {
        return res.status(400).json({
          error: 'destination_tortilleria_id must be a secondary tortilleria linked to the main tortilleria',
        });
      }
    }

    if (type === 'uso' || type === 'salida') {
      const current = await getCurrentStock(tortilleria_id, day);
      if (sacks > current) {
        return res.status(400).json({
          error: `insufficient stock: available ${current}, requested ${sacks}`,
        });
      }
    }

    const employee = employee_name.trim();
    const creator = req.user.sub;

    if (type === 'salida') {
      const transferGroup = randomUUID();
      const row = await withTransaction(async (client) => {
        const salidaRes = await client.query(
          `INSERT INTO movements (day, type, sacks, tortilleria_id, destination_tortilleria_id, transfer_group, employee_name, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, day::text AS day, type, sacks, tortilleria_id, destination_tortilleria_id, employee_name, created_by, created_at`,
          [day, 'salida', sacks, tortilleria_id, destination_tortilleria_id, transferGroup, employee, creator]
        );
        await client.query(
          `INSERT INTO movements (day, type, sacks, tortilleria_id, transfer_group, employee_name, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [day, 'llegada', sacks, destination_tortilleria_id, transferGroup, employee, creator]
        );
        return salidaRes.rows[0];
      });
      return res.status(201).json({ data: row });
    }

    const result = await query(
      `INSERT INTO movements (day, type, sacks, tortilleria_id, employee_name, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, day::text AS day, type, sacks, tortilleria_id, destination_tortilleria_id, employee_name, created_by, created_at`,
      [day, type, sacks, tortilleria_id, employee, creator]
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

    const found = await query('SELECT tortilleria_id, transfer_group FROM movements WHERE id = $1', [
      req.params.id,
    ]);
    if (found.rows.length === 0) {
      return res.status(404).json({ error: 'Movement not found' });
    }

    if (!(await isTortilleriaAccessible(req.user, found.rows[0].tortilleria_id))) {
      return res.status(403).json({ error: 'You do not have access to this tortilleria' });
    }

    const group = found.rows[0].transfer_group;
    if (group) {
      await query('DELETE FROM movements WHERE transfer_group = $1', [group]);
    } else {
      await query('DELETE FROM movements WHERE id = $1', [req.params.id]);
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { listMovements, createMovement, deleteMovement };
