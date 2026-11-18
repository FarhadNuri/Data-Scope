import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { requireRole } from '../../middleware/require-role.js';
import { datasetAccess } from '../../middleware/dataset-access.js';
import * as analyticsController from './analytics.controller.js';

const router = Router();

// GET /api/v1/analytics/overview - Platform-wide overview statistics (Admin only)
router.get('/overview', requireRole('ADMIN'), asyncHandler(analyticsController.getOverview));

// GET /api/v1/analytics/datasets/:datasetId/summary - Dataset breakdown by category and status
router.get(
  '/datasets/:datasetId/summary',
  datasetAccess('view'),
  asyncHandler(analyticsController.getDatasetSummary)
);

// GET /api/v1/analytics/datasets/:datasetId/growth - Time series record creation growth
router.get(
  '/datasets/:datasetId/growth',
  datasetAccess('view'),
  asyncHandler(analyticsController.getDatasetGrowth)
);

// GET /api/v1/analytics/search-activity - Search execution frequency and speed
router.get('/search-activity', asyncHandler(analyticsController.getSearchActivity));

// GET /api/v1/analytics/top-filters - Most frequently utilized search filters
router.get('/top-filters', asyncHandler(analyticsController.getTopFilters));

export default router;
