import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { requireRole } from '../../middleware/require-role.js';
import { datasetAccess } from '../../middleware/dataset-access.js';
import * as datasetsController from './datasets.controller.js';

const router = Router();

// GET /api/v1/datasets - List accessible datasets for the logged-in user
router.get('/', asyncHandler(datasetsController.listDatasets));

// POST /api/v1/datasets - Create a new dataset (Admin only)
router.post('/', requireRole('ADMIN'), asyncHandler(datasetsController.createDataset));

// GET /api/v1/datasets/:id - Get dataset details and field schema (Dataset access required)
router.get('/:id', datasetAccess('view'), asyncHandler(datasetsController.getDataset));

// PATCH /api/v1/datasets/:id - Update dataset metadata (Admin only)
router.patch('/:id', requireRole('ADMIN'), asyncHandler(datasetsController.updateDataset));

// DELETE /api/v1/datasets/:id - Delete dataset and cascading relations (Admin only)
router.delete('/:id', requireRole('ADMIN'), asyncHandler(datasetsController.deleteDataset));

export default router;
