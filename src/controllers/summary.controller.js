const { query } = require('../db/query');
const { isISODate, isId, collectErrors } = require('../utils/validation');

const SUMMARY_SQL = `
  WITH initial AS (
    SELECT initial_stock FROM tortillerias WHERE id = $1
  ),
  prior_net AS (
    SELECT COALESCE(SUM(CASE WHEN type = 'llegada' THEN sacks ELSE -sacks END), 0) AS net
    FROM movements
    WHERE tortilleria_id = $1 AND day < $2
  ),
  daily AS (
    SELECT day,
           COALESCE(SUM(sacks) FILTER (WHERE type = 'llegada'), 0) AS llegadas,
           COALESCE(SUM(sacks) FILTER (WHERE type = 'uso'), 0) AS usos
    FROM movements
    WHERE tortilleria_id = $1 AND day BETWEEN $2 AND $3
    GROUP BY day
  ),
  running AS (
    SELECT day, llegadas, usos,
           COALESCE(SUM(llegadas - usos) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS prev_net
    FROM daily
  )
  SELECT day,
         (SELECT initial_stock FROM initial) + (SELECT net FROM prior_net) + prev_net AS inicio,
         llegadas,
         usos,
         (SELECT initial_stock FROM initial) + (SELECT net FROM prior_net) + prev_net + llegadas - usos AS quedo
  FROM running
  ORDER BY day DESC
`;

const TODAY_SQL = `
  WITH initial AS (
    SELECT initial_stock FROM tortillerias WHERE id = $1
  ),
  prior_net AS (
    SELECT COALESCE(SUM(CASE WHEN type = 'llegada' THEN sacks ELSE -sacks END), 0) AS net
    FROM movements
    WHERE tortilleria_id = $1 AND day < CURRENT_DATE
  ),
  today_agg AS (
    SELECT COALESCE(SUM(sacks) FILTER (WHERE type = 'llegada'), 0) AS llegadas,
           COALESCE(SUM(sacks) FILTER (WHERE type = 'uso'), 0) AS usos
    FROM movements
    WHERE tortilleria_id = $1 AND day = CURRENT_DATE
  )
  SELECT CURRENT_DATE AS day,
         (SELECT initial_stock FROM initial) + (SELECT net FROM prior_net) AS inicio,
         (SELECT llegadas FROM today_agg) AS llegadas,
         (SELECT usos FROM today_agg) AS usos,
         (SELECT initial_stock FROM initial) + (SELECT net FROM prior_net)
           + (SELECT llegadas FROM today_agg) - (SELECT usos FROM today_agg) AS quedo
`;

async function validateTortilleria(tortilleria_id) {
  const err = isId(tortilleria_id);
  if (err) return err;

  const result = await query('SELECT id FROM tortillerias WHERE id = $1', [tortilleria_id]);
  if (result.rows.length === 0) return 'tortilleria_id does not exist';
  return null;
}

async function getSummary(req, res, next) {
  try {
    const { from, to, tortilleria_id } = req.query;

    const errors = collectErrors({
      tortilleria_id: isId(tortilleria_id),
      from: from ? isISODate(from) : null,
      to: to ? isISODate(to) : null,
    });

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const tortErr = await validateTortilleria(tortilleria_id);
    if (tortErr) {
      return res.status(400).json({ error: tortErr });
    }

    const start = from || '1900-01-01';
    const end = to || '9999-12-31';

    const result = await query(SUMMARY_SQL, [tortilleria_id, start, end]);
    return res.json({ data: result.rows });
  } catch (err) {
    return next(err);
  }
}

async function getToday(req, res, next) {
  try {
    const { tortilleria_id } = req.query;

    const errors = collectErrors({
      tortilleria_id: isId(tortilleria_id),
    });

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const tortErr = await validateTortilleria(tortilleria_id);
    if (tortErr) {
      return res.status(400).json({ error: tortErr });
    }

    const result = await query(TODAY_SQL, [tortilleria_id]);
    return res.json({ data: result.rows[0] || null });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getSummary, getToday };
