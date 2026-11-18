import { HttpError } from '../../utils/http-error.js';

// Validates record JSON data payload against dataset field definitions
export function validateRecordData(data, fields = [], { partial = false } = {}) {
  const details = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, 'Validation failed', [
      { field: 'data', message: 'data must be a JSON object' },
    ]);
  }

  // Index allowed field definitions by key
  const fieldMap = new Map();
  for (const f of fields) {
    fieldMap.set(f.key, f);
  }

  // 1. Verify no unknown keys are sent in the payload
  for (const key of Object.keys(data)) {
    if (!fieldMap.has(key)) {
      details.push({ field: key, message: `Unknown field "${key}"` });
      continue;
    }

    const val = data[key];

    // null or undefined is permitted (null explicitly clears a value)
    if (val === null || val === undefined) {
      continue;
    }

    const fieldDef = fieldMap.get(key);

    // 2. Validate value according to field definition type
    switch (fieldDef.type) {
      case 'text':
        if (typeof val !== 'string') {
          details.push({ field: key, message: `${key} must be a string` });
        } else if (val.length > 1000) {
          details.push({ field: key, message: `${key} must be at most 1000 characters` });
        }
        break;

      case 'number':
        if (typeof val !== 'number' || !Number.isFinite(val)) {
          details.push({ field: key, message: `${key} must be a finite number` });
        }
        break;

      case 'date':
        if (typeof val !== 'string' || Number.isNaN(Date.parse(val))) {
          details.push({ field: key, message: `${key} must be a valid ISO date string` });
        }
        break;

      case 'select':
        if (typeof val !== 'string') {
          details.push({ field: key, message: `${key} must be a string` });
        } else if (val.length > 100) {
          details.push({ field: key, message: `${key} must be at most 100 characters` });
        }
        break;

      case 'boolean':
        if (typeof val !== 'boolean') {
          details.push({ field: key, message: `${key} must be a boolean` });
        }
        break;

      default:
        // Unknown field type in schema
        break;
    }
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return data;
}
