const { query } = require('../db/query');
const {
  isNonEmptyString,
  isBoolean,
  isOptionalId,
  isId,
  isNonNegativeInteger,
  collectErrors,
} = require('../utils/validation');

const SELECT = 'SELECT id, name, is_main, main_tortilleria_id, initial_stock FROM tortillerias';

async function listTortillerias(req, res, next) {
  try {
    const result = await query(`${SELECT} ORDER BY is_main DESC, name ASC`);
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
};
