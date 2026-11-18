import { HttpError } from '../../utils/http-error.js';
import { isNonEmptyString } from '../../utils/validate.js';

const ALLOWED_TYPES = ['text', 'number', 'date', 'select', 'boolean'];
const KEY_REGEX = /^[a-z][a-z0-9_]{0,49}$/;

// Built-in system columns present on dataset_records table.
// WHY: Reserved system field names cannot be shadowed as dynamic JSONB field keys.
const RESERVED_KEYS = ['id', 'created_at', 'updated_at'];

// Validates POST /datasets/:datasetId/fields payload
export function validateCreateField(body) {
  const details = [];

  if (typeof body.key !== 'string' || !KEY_REGEX.test(body.key)) {
    details.push({
      field: 'key',
      message: 'key must start with a lowercase letter and contain only lowercase letters, numbers, and underscores (max 50 characters)',
    });
  } else if (RESERVED_KEYS.includes(body.key.toLowerCase())) {
    details.push({
      field: 'key',
      message: `"${body.key}" is a reserved system field name and cannot be used as a dataset field key`,
    });
  }

  if (!isNonEmptyString(body.label, 100)) {
    details.push({
      field: 'label',
      message: 'label is required and must be between 1 and 100 characters',
    });
  }

  if (!body.type || !ALLOWED_TYPES.includes(body.type)) {
    details.push({
      field: 'type',
      message: `type must be one of: ${ALLOWED_TYPES.join(', ')}`,
    });
  }

  if (body.isFilterable !== undefined && typeof body.isFilterable !== 'boolean') {
    details.push({ field: 'isFilterable', message: 'isFilterable must be a boolean' });
  }

  if (body.isSortable !== undefined && typeof body.isSortable !== 'boolean') {
    details.push({ field: 'isSortable', message: 'isSortable must be a boolean' });
  }

  if (body.isSearchable !== undefined && typeof body.isSearchable !== 'boolean') {
    details.push({ field: 'isSearchable', message: 'isSearchable must be a boolean' });
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    key: body.key,
    label: body.label.trim(),
    type: body.type,
    isFilterable: body.isFilterable ?? true,
    isSortable: body.isSortable ?? true,
    isSearchable: body.isSearchable ?? false,
  };
}

// Validates PATCH /datasets/:datasetId/fields/:fieldId payload
export function validateUpdateField(body) {
  // Reject attempts to modify immutable identity properties
  if (body.key !== undefined || body.type !== undefined) {
    throw new HttpError(400, 'key and type cannot be changed');
  }

  const details = [];

  if (body.label !== undefined && !isNonEmptyString(body.label, 100)) {
    details.push({
      field: 'label',
      message: 'label must be between 1 and 100 characters',
    });
  }

  if (body.isFilterable !== undefined && typeof body.isFilterable !== 'boolean') {
    details.push({ field: 'isFilterable', message: 'isFilterable must be a boolean' });
  }

  if (body.isSortable !== undefined && typeof body.isSortable !== 'boolean') {
    details.push({ field: 'isSortable', message: 'isSortable must be a boolean' });
  }

  if (body.isSearchable !== undefined && typeof body.isSearchable !== 'boolean') {
    details.push({ field: 'isSearchable', message: 'isSearchable must be a boolean' });
  }

  if (
    body.label === undefined &&
    body.isFilterable === undefined &&
    body.isSortable === undefined &&
    body.isSearchable === undefined
  ) {
    details.push({
      field: 'body',
      message: 'At least one field (label, isFilterable, isSortable, isSearchable) must be provided',
    });
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    label: body.label ? body.label.trim() : undefined,
    isFilterable: body.isFilterable,
    isSortable: body.isSortable,
    isSearchable: body.isSearchable,
  };
}

// Parses query parameters for GET /values endpoint
export function parseValuesQuery(query = {}) {
  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = 50;
  }
  if (limit > 100) {
    limit = 100;
  }

  const search = typeof query.search === 'string' ? query.search.trim() : null;

  return { limit, search };
}
