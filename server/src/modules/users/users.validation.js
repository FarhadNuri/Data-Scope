import { HttpError } from '../../utils/http-error.js';
import { isNonEmptyString } from '../../utils/validate.js';

const ALLOWED_ROLES = ['ADMIN', 'ANALYST', 'VIEWER'];

// Validates PATCH /users/:id payload
export function validateUpdateUser(body) {
  const details = [];

  if (body.name !== undefined) {
    if (!isNonEmptyString(body.name, 100)) {
      details.push({
        field: 'name',
        message: 'name must be between 1 and 100 characters',
      });
    }
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      details.push({
        field: 'isActive',
        message: 'isActive must be a boolean',
      });
    }
  }

  if (body.name === undefined && body.isActive === undefined) {
    details.push({
      field: 'body',
      message: 'At least one field (name or isActive) must be provided',
    });
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    name: body.name ? body.name.trim() : undefined,
    isActive: body.isActive,
  };
}

// Validates PATCH /users/:id/role payload
export function validateUpdateRole(body) {
  const details = [];

  if (!body.role || !ALLOWED_ROLES.includes(body.role)) {
    details.push({
      field: 'role',
      message: `role must be one of: ${ALLOWED_ROLES.join(', ')}`,
    });
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    role: body.role,
  };
}

// Parses and validates query params for user listing
export function validateListUsersQuery(query) {
  const filters = {};

  if (typeof query.search === 'string' && query.search.trim().length > 0) {
    filters.search = query.search.trim();
  }

  if (typeof query.role === 'string' && ALLOWED_ROLES.includes(query.role.toUpperCase())) {
    filters.role = query.role.toUpperCase();
  }

  if (query.isActive !== undefined) {
    if (query.isActive === 'true' || query.isActive === true) {
      filters.isActive = true;
    } else if (query.isActive === 'false' || query.isActive === false) {
      filters.isActive = false;
    }
  }

  return filters;
}
