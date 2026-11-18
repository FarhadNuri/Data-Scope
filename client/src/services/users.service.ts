import { api } from '../lib/api';
import type { AdminUser, Role } from '../types/auth';
import type { PaginationMeta } from '../types/api';

type ListUsersParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
};

// Lists user accounts across the system (Admin only)
export async function listUsers(params: ListUsersParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);
  if (params.role) query.set('role', params.role);
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive));

  const qs = query.toString();
  const res = await api<AdminUser[]>(`/users${qs ? `?${qs}` : ''}`);
  return {
    data: res.data,
    meta: res.meta as PaginationMeta,
  };
}

// Retrieves a single user account by ID (Admin only)
export async function getUser(id: string) {
  const res = await api<AdminUser>(`/users/${id}`);
  return res.data;
}

// Updates basic profile details or active status for a user (Admin only)
export async function updateUser(
  id: string,
  body: { name?: string; isActive?: boolean }
) {
  const res = await api<AdminUser>(`/users/${id}`, {
    method: 'PATCH',
    body,
  });
  return res.data;
}

// Changes a user's access role (Admin only)
export async function changeRole(id: string, role: Role) {
  const res = await api<AdminUser>(`/users/${id}/role`, {
    method: 'PATCH',
    body: { role },
  });
  return res.data;
}

export const updateUserRole = changeRole;

// Soft-deletes a user account by setting isActive to false (Admin only)
export async function deactivateUser(id: string) {
  await api<void>(`/users/${id}`, {
    method: 'DELETE',
  });
}

export const deleteUser = deactivateUser;
