import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { datasetAccess } from '../../middleware/dataset-access.js';
import * as searchController from './search.controller.js';

const router = Router();

// POST /datasets/:datasetId/records/search - Search records with filters, sort, and pagination
router.post(
  '/:datasetId/records/search',
  datasetAccess('view'),
  asyncHandler(searchController.searchRecords)
);

// POST /datasets/:datasetId/records/search/validate - Validate search configuration without executing
router.post(
  '/:datasetId/records/search/validate',
  datasetAccess('view'),
  asyncHandler(searchController.validateSearch)
);

export default router;
