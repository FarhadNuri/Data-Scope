import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { requireRole } from '../../middleware/require-role.js';
import * as usersController from './users.controller.js';

const router = Router();

// All user management routes require the ADMIN role
router.use(requireRole('ADMIN'));

// GET /api/v1/users - List users with filtering and pagination
router.get('/', asyncHandler(usersController.getUsers));

// GET /api/v1/users/:id - Get a single user by ID
router.get('/:id', asyncHandler(usersController.getUser));

// PATCH /api/v1/users/:id - Update user details (name, isActive)
router.patch('/:id', asyncHandler(usersController.updateUser));

// PATCH /api/v1/users/:id/role - Update user role
router.patch('/:id/role', asyncHandler(usersController.updateUserRole));

// DELETE /api/v1/users/:id - Soft-delete user
router.delete('/:id', asyncHandler(usersController.deleteUser));

export default router;
