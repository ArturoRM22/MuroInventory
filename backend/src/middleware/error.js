function errorHandler(err, req, res, next) {
  // Log unexpected errors; don't leak stack traces in production.
  // eslint-disable-next-line no-console
  console.error('ERROR:', err.message);

  if (err.message && err.message.includes('unique constraint')) {
    return res.status(409).json({ error: 'Resource already exists or conflicts with existing data' });
  }

  if (err.message && err.message.includes('foreign key constraint')) {
    return res.status(400).json({ error: 'Referenced resource does not exist' });
  }

  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler };
