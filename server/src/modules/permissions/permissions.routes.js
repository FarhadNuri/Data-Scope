import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { requireRole } from '../../middleware/require-role.js';
import * as permissionsController from './permissions.controller.js';

const router = Router();

// Permission management endpoints require the ADMIN role on /:datasetId/permissions
router.use('/:datasetId/permissions', requireRole('ADMIN'));

// GET /api/v1/datasets/:datasetId/permissions - List granted permissions
router.get('/:datasetId/permissions', asyncHandler(permissionsController.getPermissions));

// PUT /api/v1/datasets/:datasetId/permissions - Replace full permission set
router.put('/:datasetId/permissions', asyncHandler(permissionsController.replacePermissions));

// DELETE /api/v1/datasets/:datasetId/permissions/:userId - Remove a user permission
router.delete('/:datasetId/permissions/:userId', asyncHandler(permissionsController.deletePermission));

export default router;
