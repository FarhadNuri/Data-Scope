import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import * as historyController from './search-history.controller.js';

const router = Router();

// GET /api/v1/search-history - List distinct recent searches for the authenticated user
router.get('/', asyncHandler(historyController.getHistory));

// DELETE /api/v1/search-history/:id - Hide a specific search configuration from list
router.delete('/:id', asyncHandler(historyController.deleteHistoryItem));

// DELETE /api/v1/search-history - Hide all search configurations for the user
router.delete('/', asyncHandler(historyController.clearHistory));

export default router;
