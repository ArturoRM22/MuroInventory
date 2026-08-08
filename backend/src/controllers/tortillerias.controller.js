const { query } = require('../db/query');
const {
  isNonEmptyString,
  isBoolean,
  isOptionalId,
  isId,
  isNonNegativeInteger,
  collectErrors,
} = require('../utils/validation');
const { isTortilleriaAccessible } = require('../middleware/auth');

const SELECT = 'SELECT id, name, is_main, main_tortilleria_id, initial_stock FROM tortillerias';

async function listTortillerias(req, res, next) {
  try {
    const isSuper = req.user.role === 'super';
    const result = await query(
      `${SELECT}
       ${isSuper ? '' : 'WHERE id IN (SELECT tortilleria_id FROM user_tortillerias WHERE user_id = $1)'}
       ORDER BY is_main DESC, name ASC`,
      isSuper ? [] : [req.user.sub]
    );
    return res.json({ data: result.rows });
  } catch (err) {
    return next(err);
  }
}

async function getTortilleriaById(req, res, next) {
  try {
    const idErr = isId(req.params.id);
    if (idErr) {
      return res.status(400).json({ error: 'Invalid tortilleria id', details: { id: idErr } });
    }

    if (!(await isTortilleriaAccessible(req.user, Number(req.params.id)))) {
      return res.status(403).json({ error: 'You do not have access to this tortilleria' });
    }

    const result = await query(`${SELECT} WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tortilleria not found' });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

async function createTortilleria(req, res, next) {
  try {
    const { name, is_main, main_tortilleria_id, initial_stock } = req.body || {};

    const errors = collectErrors({
      name: isNonEmptyString(name),
      is_main: isBoolean(is_main),
      main_tortilleria_id: isOptionalId(main_tortilleria_id),
      initial_stock: initial_stock !== undefined ? isNonNegativeInteger(initial_stock) : null,
    });

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const businessError = await validateTortilleriaRules({ is_main, main_tortilleria_id });
    if (businessError) {
      return res.status(400).json({ error: businessError });
    }

    const result = await query(
      `INSERT INTO tortillerias (name, is_main, main_tortilleria_id, initial_stock)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, is_main, main_tortilleria_id, initial_stock`,
      [name.trim(), is_main, main_tortilleria_id || null, initial_stock ?? 0]
    );

    await query(
      'INSERT INTO user_tortillerias (user_id, tortilleria_id) VALUES ($1, $2)',
      [req.user.sub, result.rows[0].id]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

async function updateTortilleria(req, res, next) {
  try {
    const idErr = isId(req.params.id);
    if (idErr) {
      return res.status(400).json({ error: 'Invalid tortilleria id', details: { id: idErr } });
    }

    if (!(await isTortilleriaAccessible(req.user, Number(req.params.id)))) {
      return res.status(403).json({ error: 'You do not have access to this tortilleria' });
    }

    const { name, is_main, main_tortilleria_id, initial_stock } = req.body || {};

    // Build only the fields provided.
    const updates = [];
    const values = [];

    if (name !== undefined) {
      const err = isNonEmptyString(name);
      if (err) {
        return res.status(400).json({ error: 'Validation failed', details: { name: err } });
      }
      updates.push(`name = $${updates.length + 1}`);
      values.push(name.trim());
    }

    if (is_main !== undefined) {
      const err = isBoolean(is_main);
      if (err) {
        return res.status(400).json({ error: 'Validation failed', details: { is_main: err } });
      }
      updates.push(`is_main = $${updates.length + 1}`);
      values.push(is_main);
    }

    if (main_tortilleria_id !== undefined) {
      const err = isOptionalId(main_tortilleria_id);
      if (err) {
        return res.status(400).json({
          error: 'Validation failed',
          details: { main_tortilleria_id: err },
        });
      }
      updates.push(`main_tortilleria_id = $${updates.length + 1}`);
      values.push(main_tortilleria_id || null);
    }

    if (initial_stock !== undefined) {
      const err = isNonNegativeInteger(initial_stock);
      if (err) {
        return res.status(400).json({
          error: 'Validation failed',
          details: { initial_stock: err },
        });
      }
      updates.push(`initial_stock = $${updates.length + 1}`);
      values.push(initial_stock);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    // Fetch current record to validate the resulting state.
    const current = await query('SELECT * FROM tortillerias WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Tortilleria not found' });
    }

    const nextState = {
      is_main: is_main !== undefined ? is_main : current.rows[0].is_main,
      main_tortilleria_id:
        main_tortilleria_id !== undefined
          ? main_tortilleria_id || null
          : current.rows[0].main_tortilleria_id,
    };

    const businessError = await validateTortilleriaRules(nextState);
    if (businessError) {
      return res.status(400).json({ error: businessError });
    }

    values.push(req.params.id);
    const result = await query(
      `UPDATE tortillerias SET ${updates.join(', ')}
       WHERE id = $${values.length}
       RETURNING id, name, is_main, main_tortilleria_id, initial_stock`,
      values
    );

    return res.json({ data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

async function deleteTortilleria(req, res, next) {
  try {
    const idErr = isId(req.params.id);
    if (idErr) {
      return res.status(400).json({ error: 'Invalid tortilleria id', details: { id: idErr } });
    }

    if (!(await isTortilleriaAccessible(req.user, Number(req.params.id)))) {
      return res.status(403).json({ error: 'You do not have access to this tortilleria' });
    }

    const movementCount = await query(
      `SELECT COUNT(*)::int AS total FROM movements
       WHERE tortilleria_id = $1 OR destination_tortilleria_id = $1`,
      [req.params.id]
    );
    if (movementCount.rows[0].total > 0) {
      return res.status(409).json({
        error: `Cannot delete: tortilleria is referenced by ${movementCount.rows[0].total} movement record(s). Delete them first.`,
      });
    }

    const secondaryCount = await query(
      'SELECT COUNT(*)::int AS total FROM tortillerias WHERE main_tortilleria_id = $1',
      [req.params.id]
    );
    if (secondaryCount.rows[0].total > 0) {
      return res.status(409).json({
        error: `Cannot delete: tortilleria has ${secondaryCount.rows[0].total} linked secondary tortilleria(s). Delete or reassign them first.`,
      });
    }

    const result = await query('DELETE FROM tortillerias WHERE id = $1 RETURNING id', [
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tortilleria not found' });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function listTortilleriaUsers(req, res, next) {
  try {
    const idErr = isId(req.params.id);
    if (idErr) {
      return res.status(400).json({ error: 'Invalid tortilleria id', details: { id: idErr } });
    }

    const tortilleria = await query('SELECT id FROM tortillerias WHERE id = $1', [req.params.id]);
    if (tortilleria.rows.length === 0) {
      return res.status(404).json({ error: 'Tortilleria not found' });
    }

    const result = await query(
      `SELECT u.id, u.name, u.role
       FROM users u
       JOIN user_tortillerias ut ON ut.user_id = u.id
       WHERE ut.tortilleria_id = $1
       ORDER BY u.name ASC`,
      [req.params.id]
    );

    return res.json({ data: result.rows });
  } catch (err) {
    return next(err);
  }
}

async function addTortilleriaUser(req, res, next) {
  try {
    const { user_id } = req.body || {};

    const idErr = isId(req.params.id);
    const userIdErr = isId(user_id);
    const errors = collectErrors({
      id: idErr,
      user_id: userIdErr,
    });
    if (errors) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const tortilleria = await query('SELECT id FROM tortillerias WHERE id = $1', [req.params.id]);
    if (tortilleria.rows.length === 0) {
      return res.status(404).json({ error: 'Tortilleria not found' });
    }

    const user = await query('SELECT id, name, role FROM users WHERE id = $1', [user_id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.rows[0].role === 'super') {
      return res.status(400).json({ error: 'The super user cannot be assigned to a tortilleria' });
    }

    const existing = await query(
      'SELECT 1 FROM user_tortillerias WHERE user_id = $1 AND tortilleria_id = $2',
      [user_id, req.params.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User is already assigned to this tortilleria' });
    }

    await query(
      'INSERT INTO user_tortillerias (user_id, tortilleria_id) VALUES ($1, $2)',
      [user_id, req.params.id]
    );

    return res.status(201).json({ data: user.rows[0] });
  } catch (err) {
    return next(err);
  }
}

async function removeTortilleriaUser(req, res, next) {
  try {
    const idErr = isId(req.params.id);
    const userIdErr = isId(req.params.userId);
    const errors = collectErrors({
      id: idErr,
      userId: userIdErr,
    });
    if (errors) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const result = await query(
      'DELETE FROM user_tortillerias WHERE user_id = $1 AND tortilleria_id = $2',
      [req.params.userId, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User is not assigned to this tortilleria' });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

/**
 * Business-rule validation shared by create and update.
 * Returns an error string or null.
 */
async function validateTortilleriaRules({ is_main, main_tortilleria_id }) {
  if (is_main && main_tortilleria_id) {
    return 'A main tortilleria cannot have a main_tortilleria_id';
  }

  if (!is_main && !main_tortilleria_id) {
    return 'A secondary tortilleria must be linked to a main tortilleria';
  }

  if (main_tortilleria_id) {
    const main = await query('SELECT is_main FROM tortillerias WHERE id = $1', [
      main_tortilleria_id,
    ]);
    if (main.rows.length === 0) {
      return 'main_tortilleria_id does not exist';
    }
    if (!main.rows[0].is_main) {
      return 'main_tortilleria_id must reference a main tortilleria';
    }
  }

  return null;
}

module.exports = {
  listTortillerias,
  getTortilleriaById,
  createTortilleria,
  updateTortilleria,
  deleteTortilleria,
  listTortilleriaUsers,
  addTortilleriaUser,
  removeTortilleriaUser,
};
