import { api } from '../lib/api';
import type { SavedView } from '../types/saved-view';
import type { SearchConfig } from '../types/search';
import type { PaginationMeta } from '../types/api';

type ListViewsParams = {
  datasetId?: string;
  scope?: 'mine' | 'shared' | 'all';
  page?: number;
  pageSize?: number;
};

// Lists saved views accessible to the user (mine, shared, or all)
export async function listViews(params: ListViewsParams = {}) {
  const query = new URLSearchParams();
  if (params.datasetId) query.set('datasetId', params.datasetId);
  if (params.scope) query.set('scope', params.scope);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const qs = query.toString();
  const res = await api<SavedView[]>(`/saved-views${qs ? `?${qs}` : ''}`);
  return {
    data: res.data,
    meta: res.meta as PaginationMeta,
  };
}

// Creates a new saved search preset (requires Analyst or Admin)
export async function createView(body: {
  name: string;
  datasetId: string;
  config: SearchConfig;
}) {
  const res = await api<SavedView>('/saved-views', {
    method: 'POST',
    body,
  });
  return res.data;
}

// Retrieves a single saved view by ID
export async function getView(id: string) {
  const res = await api<SavedView>(`/saved-views/${id}`);
  return res.data;
}

// Updates an owned saved view's name or search configuration
export async function updateView(
  id: string,
  body: { name?: string; config?: SearchConfig }
) {
  const res = await api<SavedView>(`/saved-views/${id}`, {
    method: 'PATCH',
    body,
  });
  return res.data;
}

// Permanently deletes an owned saved view
export async function deleteView(id: string) {
  await api<void>(`/saved-views/${id}`, {
    method: 'DELETE',
  });
}

// Shares an owned view with a list of user IDs
export async function shareView(id: string, userIds: string[]) {
  const res = await api<{
    sharedWith: { id: string; name: string; email: string }[];
  }>(`/saved-views/${id}/share`, {
    method: 'POST',
    body: { userIds },
  });
  return res.data;
}

// Revokes view sharing for a specific user ID
export async function unshareView(id: string, userId: string) {
  await api<void>(`/saved-views/${id}/share/${userId}`, {
    method: 'DELETE',
  });
}
