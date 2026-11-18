import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import * as healthController from './health.controller.js';

const router = Router();

// GET /api/v1/health (public)
router.get('/', asyncHandler(healthController.getHealth));

export default router;
