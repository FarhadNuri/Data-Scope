import { HttpError } from '../../utils/http-error.js';
import { isUuid } from '../../utils/validate.js';

const ALLOWED_LEVELS = ['view', 'manage'];

// Validates the PUT /datasets/:datasetId/permissions request body
export function validateReplacePermissions(body) {
  const details = [];

  if (!body || !Array.isArray(body.permissions)) {
    throw new HttpError(400, 'Validation failed', [
      { field: 'permissions', message: 'permissions must be an array' },
    ]);
  }

  const seenUserIds = new Set();

  body.permissions.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      details.push({
        field: `permissions[${index}]`,
        message: 'Permission entry must be an object',
      });
      return;
    }

    if (!isUuid(item.userId)) {
      details.push({
        field: `permissions[${index}].userId`,
        message: 'userId must be a valid UUID',
      });
    } else if (seenUserIds.has(item.userId)) {
      details.push({
        field: `permissions[${index}].userId`,
        message: `Duplicate userId "${item.userId}" in permissions list`,
      });
    } else {
      seenUserIds.add(item.userId);
    }

    if (!ALLOWED_LEVELS.includes(item.level)) {
      details.push({
        field: `permissions[${index}].level`,
        message: 'level must be either "view" or "manage"',
      });
    }
  });

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    permissions: body.permissions.map((item) => ({
      userId: item.userId,
      level: item.level,
    })),
  };
}
