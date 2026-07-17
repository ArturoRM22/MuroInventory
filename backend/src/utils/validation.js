/**
 * Manual validation helpers.
 * No Zod here — these functions return either `null` (valid) or a short error message.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isString(value) {
  return typeof value === 'string';
}

function isNonEmptyString(value) {
  if (!isString(value)) return 'must be a string';
  if (value.trim().length === 0) return 'cannot be empty';
  return null;
}

function isId(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) return 'must be a positive integer';
  return null;
}

function isOptionalId(value) {
  if (value === null || value === undefined) return null;
  return isId(value);
}

function isBoolean(value) {
  if (typeof value !== 'boolean') return 'must be a boolean';
  return null;
}

function isInteger(value) {
  if (typeof value !== 'number' || !Number.isInteger(value)) return 'must be an integer';
  return null;
}

function isNonNegativeInteger(value) {
  const intErr = isInteger(value);
  if (intErr) return intErr;
  if (value < 0) return 'cannot be negative';
  return null;
}

function isOneOf(value, allowed) {
  if (!allowed.includes(value)) return `must be one of: ${allowed.join(', ')}`;
  return null;
}

function isISODate(value) {
  if (!isString(value)) return 'must be a date string (YYYY-MM-DD)';
  if (!ISO_DATE_RE.test(value)) return 'must be a valid date string (YYYY-MM-DD)';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'must be a valid date';
  return null;
}

/**
 * Collects errors for an object of field->validator results.
 * Returns an object like { name: 'cannot be empty' } or null if clean.
 */
function collectErrors(fields) {
  const errors = {};
  for (const [key, message] of Object.entries(fields)) {
    if (message) errors[key] = message;
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

module.exports = {
  isString,
  isNonEmptyString,
  isId,
  isOptionalId,
  isBoolean,
  isInteger,
  isNonNegativeInteger,
  isOneOf,
  isISODate,
  collectErrors,
};
