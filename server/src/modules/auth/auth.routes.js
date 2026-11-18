import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authRateLimiter } from '../../middleware/rate-limit.js';
import { authenticate } from '../../middleware/auth.js';
import * as authController from './auth.controller.js';

const router = Router();

// POST /api/v1/auth/register (public, rate limited)
router.post('/register', authRateLimiter, asyncHandler(authController.register));

// POST /api/v1/auth/login (public, rate limited)
router.post('/login', authRateLimiter, asyncHandler(authController.login));

// GET /api/v1/auth/me (requires valid authentication token)
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
