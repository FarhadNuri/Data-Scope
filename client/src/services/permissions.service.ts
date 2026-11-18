import { api } from '../lib/api';
import type { DatasetPermission, PermissionLevel } from '../types/dataset';

// Fetches the list of user permissions configured for a dataset (Admin only)
export async function getPermissions(datasetId: string) {
  const res = await api<DatasetPermission[]>(`/datasets/${datasetId}/permissions`);
  return res.data;
}

// Replaces the complete set of user permissions on a dataset (Admin only)
export async function replacePermissions(
  datasetId: string,
  permissions: { userId: string; level: PermissionLevel }[]
) {
  const res = await api<DatasetPermission[]>(`/datasets/${datasetId}/permissions`, {
    method: 'PUT',
    body: { permissions },
  });
  return res.data;
}

// Revokes dataset access for a specific user ID (Admin only)
export async function removePermission(datasetId: string, userId: string) {
  await api<void>(`/datasets/${datasetId}/permissions/${userId}`, {
    method: 'DELETE',
  });
}
