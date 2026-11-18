import * as usersModel from './users.model.js';
import { HttpError } from '../../utils/http-error.js';
import { buildPaginationMeta } from '../../utils/pagination.js';

// Retrieves a paginated list of users matching query filters
export async function listUsers({ page, pageSize, search, role, isActive }) {
  const { users, totalItems } = await usersModel.findMany({
    page,
    pageSize,
    search,
    role,
    isActive,
  });

  const meta = buildPaginationMeta(page, pageSize, totalItems);
  return { users, meta };
}

// Retrieves a single user by ID
export async function getUserById(id) {
  const user = await usersModel.findById(id);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  return user;
}

// Updates a user's editable profile fields (name, isActive)
export async function updateUser(id, updates, currentUser) {
  const user = await usersModel.findById(id);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // BUSINESS RULE: An admin cannot deactivate their own account
  if (updates.isActive === false && id === currentUser.id) {
    throw new HttpError(400, 'Admins cannot deactivate their own account');
  }

  // BUSINESS RULE: The last active admin cannot be deactivated
  if (updates.isActive === false && user.role === 'ADMIN' && user.isActive) {
    const activeAdminCount = await usersModel.countActiveAdmins();
    if (activeAdminCount <= 1) {
      throw new HttpError(400, 'Cannot deactivate the last active admin');
    }
  }

  return usersModel.update(id, updates);
}

// Updates a user's assigned role (ADMIN, ANALYST, VIEWER)
export async function updateUserRole(id, newRole, currentUser) {
  const user = await usersModel.findById(id);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // BUSINESS RULE: An admin cannot change their own role (prevents self-demotion lockout)
  if (id === currentUser.id) {
    throw new HttpError(400, 'Admins cannot change their own role');
  }

  // BUSINESS RULE: The last active admin cannot be demoted
  if (user.role === 'ADMIN' && newRole !== 'ADMIN' && user.isActive) {
    const activeAdminCount = await usersModel.countActiveAdmins();
    if (activeAdminCount <= 1) {
      throw new HttpError(400, 'Cannot demote the last active admin');
    }
  }

  return usersModel.update(id, { role: newRole });
}

// Soft-deletes a user account by setting isActive = false
export async function deleteUser(id, currentUser) {
  const user = await usersModel.findById(id);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // BUSINESS RULE: An admin cannot delete/deactivate their own account
  if (id === currentUser.id) {
    throw new HttpError(400, 'Admins cannot deactivate their own account');
  }

  // BUSINESS RULE: The last active admin cannot be deactivated
  if (user.role === 'ADMIN' && user.isActive) {
    const activeAdminCount = await usersModel.countActiveAdmins();
    if (activeAdminCount <= 1) {
      throw new HttpError(400, 'Cannot deactivate the last active admin');
    }
  }

  await usersModel.update(id, { isActive: false });
}
