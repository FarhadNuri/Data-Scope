import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { requireRole } from '../../middleware/require-role.js';
import { isUuid } from '../../utils/validate.js';
import { HttpError } from '../../utils/http-error.js';
import * as savedViewsController from './saved-views.controller.js';

const router = Router();

// Validate UUID parameter format on all view and user path variables
router.param('id', (req, res, next, val) => {
  if (!isUuid(val)) {
    return next(new HttpError(400, 'Invalid view ID format'));
  }
  next();
});

router.param('userId', (req, res, next, val) => {
  if (!isUuid(val)) {
    return next(new HttpError(400, 'Invalid user ID format'));
  }
  next();
});

// GET /api/v1/saved-views - List accessible views (own and shared)
router.get('/', asyncHandler(savedViewsController.listViews));

// POST /api/v1/saved-views - Create a saved view (Admin or Analyst)
router.post('/', requireRole('ADMIN', 'ANALYST'), asyncHandler(savedViewsController.createView));

// GET /api/v1/saved-views/:id - Retrieve a view by ID (Owner or shared recipient)
router.get('/:id', asyncHandler(savedViewsController.getViewById));

// PATCH /api/v1/saved-views/:id - Update view configuration (Owner only)
router.patch('/:id', asyncHandler(savedViewsController.updateView));

// DELETE /api/v1/saved-views/:id - Delete view (Owner only)
router.delete('/:id', asyncHandler(savedViewsController.deleteView));

// POST /api/v1/saved-views/:id/share - Share view with users (Owner only)
router.post('/:id/share', asyncHandler(savedViewsController.shareView));

// DELETE /api/v1/saved-views/:id/share/:userId - Revoke view share from a user (Owner only)
router.delete('/:id/share/:userId', asyncHandler(savedViewsController.removeShare));

export default router;
