import { HttpError } from '../../utils/http-error.js';
import { isNonEmptyString } from '../../utils/validate.js';

// Validates POST /datasets payload
export function validateCreateDataset(body) {
  const details = [];

  if (!isNonEmptyString(body.name, 100)) {
    details.push({
      field: 'name',
      message: 'name is required and must be between 1 and 100 characters',
    });
  }

  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      details.push({ field: 'description', message: 'description must be a string' });
    }
  }

  if (!isNonEmptyString(body.category, 50)) {
    details.push({
      field: 'category',
      message: 'category is required and must be between 1 and 50 characters',
    });
  }

  if (!isNonEmptyString(body.dataSource, 100)) {
    details.push({
      field: 'dataSource',
      message: 'dataSource is required and must be between 1 and 100 characters',
    });
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    name: body.name.trim(),
    description: body.description ? body.description.trim() : null,
    category: body.category.trim(),
    dataSource: body.dataSource.trim(),
  };
}

// Validates PATCH /datasets/:id payload
export function validateUpdateDataset(body) {
  const details = [];

  if (body.name !== undefined && !isNonEmptyString(body.name, 100)) {
    details.push({
      field: 'name',
      message: 'name must be between 1 and 100 characters',
    });
  }

  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      details.push({ field: 'description', message: 'description must be a string' });
    }
  }

  if (body.category !== undefined && !isNonEmptyString(body.category, 50)) {
    details.push({
      field: 'category',
      message: 'category must be between 1 and 50 characters',
    });
  }

  if (body.dataSource !== undefined && !isNonEmptyString(body.dataSource, 100)) {
    details.push({
      field: 'dataSource',
      message: 'dataSource must be between 1 and 100 characters',
    });
  }

  if (
    body.name === undefined &&
    body.description === undefined &&
    body.category === undefined &&
    body.dataSource === undefined
  ) {
    details.push({
      field: 'body',
      message: 'At least one field (name, description, category, dataSource) must be provided',
    });
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    name: body.name ? body.name.trim() : undefined,
    description: body.description !== undefined ? (body.description ? body.description.trim() : null) : undefined,
    category: body.category ? body.category.trim() : undefined,
    dataSource: body.dataSource ? body.dataSource.trim() : undefined,
  };
}

// Parses query string filters for GET /datasets
export function validateListDatasetsQuery(query = {}) {
  const search = typeof query.search === 'string' && query.search.trim() ? query.search.trim() : null;
  const category = typeof query.category === 'string' && query.category.trim() ? query.category.trim() : null;

  return { search, category };
}
