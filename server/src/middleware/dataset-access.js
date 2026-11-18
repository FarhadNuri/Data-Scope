import * as permissionsService from '../modules/permissions/permissions.service.js';
import { isUuid } from '../utils/validate.js';
import { HttpError } from '../utils/http-error.js';

// Route-level middleware generator verifying user access to a specific dataset.
// Accepted levels:
// - 'view': Read access for records, searches, views, analytics
// - 'manage': Write/mutation access for records
export function datasetAccess(level) {
  return async function (req, res, next) {
    // 1. Read the dataset ID from URL params:
    // Top-level dataset routes bind parameter ':id' (e.g., GET /datasets/:id),
    // while nested sub-resources bind ':datasetId' (e.g., GET /datasets/:datasetId/fields).
    const datasetId = req.params.datasetId || req.params.id;

    if (!datasetId || !isUuid(datasetId)) {
      return next(new HttpError(400, 'Invalid dataset ID format'));
    }

    // 2. Verify dataset existence before checking permissions so missing datasets return 404 instead of 403
    const exists = await permissionsService.datasetExists(datasetId);
    if (!exists) {
      return next(new HttpError(404, 'Dataset not found'));
    }

    // 3. Verify user has the required permission level
    if (level === 'view') {
      const canView = await permissionsService.canUserViewDataset(req.user, datasetId);
      if (!canView) {
        return next(new HttpError(403, 'You do not have access to this dataset'));
      }
    } else if (level === 'manage') {
      const canManage = await permissionsService.canUserManageDataset(req.user, datasetId);
      if (!canManage) {
        return next(new HttpError(403, 'You do not have access to this dataset'));
      }
    }

    next();
  };
}
