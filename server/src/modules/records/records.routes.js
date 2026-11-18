import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { datasetAccess } from '../../middleware/dataset-access.js';
import { isUuid } from '../../utils/validate.js';
import { HttpError } from '../../utils/http-error.js';
import * as recordsController from './records.controller.js';

const router = Router();

// Validate :recordId parameter format across all routes
router.param('recordId', (req, res, next, val) => {
  if (!isUuid(val)) {
    return next(new HttpError(400, 'Invalid record ID format'));
  }
  next();
});

// GET /datasets/:datasetId/records/:recordId
router.get('/:datasetId/records/:recordId', datasetAccess('view'), asyncHandler(recordsController.getRecord));

// GET /datasets/:datasetId/records/:recordId/related
router.get('/:datasetId/records/:recordId/related', datasetAccess('view'), asyncHandler(recordsController.getRelated));

// GET /datasets/:datasetId/records/:recordId/history
router.get('/:datasetId/records/:recordId/history', datasetAccess('view'), asyncHandler(recordsController.getHistory));

// POST /datasets/:datasetId/records
router.post('/:datasetId/records', datasetAccess('view'), asyncHandler(recordsController.createRecord));

// PATCH /datasets/:datasetId/records/:recordId
router.patch('/:datasetId/records/:recordId', datasetAccess('view'), asyncHandler(recordsController.updateRecord));

// DELETE /datasets/:datasetId/records/:recordId
router.delete('/:datasetId/records/:recordId', datasetAccess('view'), asyncHandler(recordsController.deleteRecord));

export default router;
