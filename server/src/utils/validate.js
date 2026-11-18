// Regular expression matching standard 36-character UUID format (v1-v5)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Regular expression for basic email format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Checks whether a value is a valid UUID string
export function isUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

// Checks whether a value is a non-empty string, optionally checking maximum length
export function isNonEmptyString(value, maxLength) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (typeof maxLength === 'number' && trimmed.length > maxLength) return false;
  return true;
}

// Checks whether a value is a valid email string
export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_REGEX.test(value);
}
