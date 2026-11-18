import * as usersService from './users.service.js';
import {
  validateUpdateUser,
  validateUpdateRole,
  validateListUsersQuery,
} from './users.validation.js';
import { parsePagination } from '../../utils/pagination.js';
import { isUuid } from '../../utils/validate.js';
import { HttpError } from '../../utils/http-error.js';

// GET /api/v1/users
export async function getUsers(req, res) {
  const pagination = parsePagination(req.query);
  const filters = validateListUsersQuery(req.query);

  const { users, meta } = await usersService.listUsers({
    ...pagination,
    ...filters,
  });

  res.status(200).json({
    success: true,
    data: users,
    meta,
  });
}

// GET /api/v1/users/:id
export async function getUser(req, res) {
  if (!isUuid(req.params.id)) {
    throw new HttpError(400, 'Invalid user ID format');
  }

  const user = await usersService.getUserById(req.params.id);
  res.status(200).json({
    success: true,
    data: user,
  });
}

// PATCH /api/v1/users/:id
export async function updateUser(req, res) {
  if (!isUuid(req.params.id)) {
    throw new HttpError(400, 'Invalid user ID format');
  }

  const updates = validateUpdateUser(req.body);
  const updatedUser = await usersService.updateUser(req.params.id, updates, req.user);
  res.status(200).json({
    success: true,
    data: updatedUser,
  });
}

// PATCH /api/v1/users/:id/role
export async function updateUserRole(req, res) {
  if (!isUuid(req.params.id)) {
    throw new HttpError(400, 'Invalid user ID format');
  }

  const { role } = validateUpdateRole(req.body);
  const updatedUser = await usersService.updateUserRole(req.params.id, role, req.user);
  res.status(200).json({
    success: true,
    data: updatedUser,
  });
}

// DELETE /api/v1/users/:id
export async function deleteUser(req, res) {
  if (!isUuid(req.params.id)) {
    throw new HttpError(400, 'Invalid user ID format');
  }

  await usersService.deleteUser(req.params.id, req.user);
  res.status(204).end();
}
