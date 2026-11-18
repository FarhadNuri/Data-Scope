import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import * as userPreferencesController from './user-preferences.controller.js';

const router = Router();

// GET /api/v1/preferences - Retrieve current user preferences
router.get('/', asyncHandler(userPreferencesController.getPreferences));

// PUT /api/v1/preferences - Upsert current user preferences
router.put('/', asyncHandler(userPreferencesController.updatePreferences));

export default router;
