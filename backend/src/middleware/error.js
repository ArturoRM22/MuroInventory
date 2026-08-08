function errorHandler(err, req, res, next) {
  // Log unexpected errors; don't leak stack traces in production.
  // eslint-disable-next-line no-console
  console.error('ERROR:', err.message);

  if (err.code === '23503' || (err.message && err.message.includes('foreign key constraint'))) {
    if (err.detail && err.detail.includes('is still referenced from table')) {
      const match = /table "([^"]+)"/.exec(err.detail);
      const table = match ? match[1] : 'otra tabla';
      return res
        .status(409)
        .json({ error: `Cannot delete: record is referenced by table "${table}"` });
    }
    return res.status(400).json({ error: 'Referenced resource does not exist' });
  }

  if (err.code === '23514') {
    return res.status(400).json({
      error: 'Validation failed',
      details: { constraint: err.constraint || err.message },
    });
  }

  if (err.message && err.message.includes('unique constraint')) {
    return res.status(409).json({ error: 'Resource already exists or conflicts with existing data' });
  }

  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler };
