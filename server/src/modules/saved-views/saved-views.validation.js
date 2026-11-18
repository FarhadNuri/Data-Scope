import { HttpError } from '../../utils/http-error.js';
import { isUuid } from '../../utils/validate.js';

// Validates request body for creating a saved view
export function validateCreateView(body) {
  const details = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Validation failed', [
      { field: 'body', message: 'Request body must be a JSON object' },
    ]);
  }

  // Name validation: string, 1 to 100 characters
  if (typeof body.name !== 'string' || body.name.trim() === '') {
    details.push({ field: 'name', message: 'name is required' });
  } else if (body.name.trim().length > 100) {
    details.push({ field: 'name', message: 'name must be at most 100 characters' });
  }

  // Dataset ID validation: valid UUID format
  if (!body.datasetId || typeof body.datasetId !== 'string' || !isUuid(body.datasetId)) {
    details.push({ field: 'datasetId', message: 'datasetId must be a valid UUID' });
  }

  // Config validation: JSON object representing search request
  if (!body.config || typeof body.config !== 'object' || Array.isArray(body.config)) {
    details.push({ field: 'config', message: 'config must be a JSON object' });
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    name: body.name.trim(),
    datasetId: body.datasetId,
    config: body.config,
  };
}

// Validates request body for updating a saved view
export function validateUpdateView(body) {
  const details = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Validation failed', [
      { field: 'body', message: 'Request body must be a JSON object' },
    ]);
  }

  if (body.name === undefined && body.config === undefined) {
    throw new HttpError(400, 'Validation failed', [
      { field: 'body', message: 'At least one of name or config must be provided' },
    ]);
  }

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      details.push({ field: 'name', message: 'name cannot be empty' });
    } else if (body.name.trim().length > 100) {
      details.push({ field: 'name', message: 'name must be at most 100 characters' });
    }
  }

  if (body.config !== undefined) {
    if (!body.config || typeof body.config !== 'object' || Array.isArray(body.config)) {
      details.push({ field: 'config', message: 'config must be a JSON object' });
    }
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    name: body.name !== undefined ? body.name.trim() : undefined,
    config: body.config,
  };
}

// Validates request body for sharing a saved view with other users
export function validateShareView(body) {
  const details = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Validation failed', [
      { field: 'body', message: 'Request body must be a JSON object' },
    ]);
  }

  if (!Array.isArray(body.userIds) || body.userIds.length === 0) {
    details.push({ field: 'userIds', message: 'userIds must be a non-empty array of UUIDs' });
  } else {
    for (let i = 0; i < body.userIds.length; i++) {
      if (!isUuid(body.userIds[i])) {
        details.push({ field: `userIds[${i}]`, message: 'Must be a valid UUID' });
      }
    }
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    userIds: [...new Set(body.userIds)], // Deduplicate
  };
}
