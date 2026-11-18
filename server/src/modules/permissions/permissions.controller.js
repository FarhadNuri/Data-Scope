import * as permissionsService from './permissions.service.js';
import { validateReplacePermissions } from './permissions.validation.js';
import { isUuid } from '../../utils/validate.js';
import { HttpError } from '../../utils/http-error.js';

// GET /api/v1/datasets/:datasetId/permissions
export async function getPermissions(req, res) {
  if (!isUuid(req.params.datasetId)) {
    throw new HttpError(400, 'Invalid dataset ID format');
  }

  const permissions = await permissionsService.getPermissions(req.params.datasetId);
  res.status(200).json({
    success: true,
    data: permissions,
  });
}

// PUT /api/v1/datasets/:datasetId/permissions
export async function replacePermissions(req, res) {
  if (!isUuid(req.params.datasetId)) {
    throw new HttpError(400, 'Invalid dataset ID format');
  }

  const { permissions } = validateReplacePermissions(req.body);
  const savedPermissions = await permissionsService.replacePermissions(
    req.params.datasetId,
    permissions
  );

  res.status(200).json({
    success: true,
    data: savedPermissions,
  });
}

// DELETE /api/v1/datasets/:datasetId/permissions/:userId
export async function deletePermission(req, res) {
  if (!isUuid(req.params.datasetId)) {
    throw new HttpError(400, 'Invalid dataset ID format');
  }

  if (!isUuid(req.params.userId)) {
    throw new HttpError(400, 'Invalid user ID format');
  }

  await permissionsService.removePermission(req.params.datasetId, req.params.userId);
  res.status(204).end();
}
