import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { requireRole } from '../../middleware/require-role.js';
import { datasetAccess } from '../../middleware/dataset-access.js';
import * as fieldsController from './dataset-fields.controller.js';

const router = Router();

// GET /api/v1/datasets/:datasetId/fields - List all fields in dataset
router.get(
  '/:datasetId/fields',
  datasetAccess('view'),
  asyncHandler(fieldsController.getFields)
);

// POST /api/v1/datasets/:datasetId/fields - Define a new dataset field (Admin only)
router.post(
  '/:datasetId/fields',
  requireRole('ADMIN'),
  datasetAccess('view'),
  asyncHandler(fieldsController.createField)
);

// PATCH /api/v1/datasets/:datasetId/fields/:fieldId - Update field metadata (Admin only)
router.patch(
  '/:datasetId/fields/:fieldId',
  requireRole('ADMIN'),
  asyncHandler(fieldsController.updateField)
);

// DELETE /api/v1/datasets/:datasetId/fields/:fieldId - Remove field definition (Admin only)
router.delete(
  '/:datasetId/fields/:fieldId',
  requireRole('ADMIN'),
  asyncHandler(fieldsController.deleteField)
);

// GET /api/v1/datasets/:datasetId/fields/:fieldId/values - Distinct values of a select field
router.get(
  '/:datasetId/fields/:fieldId/values',
  datasetAccess('view'),
  asyncHandler(fieldsController.getFieldValues)
);

export default router;
