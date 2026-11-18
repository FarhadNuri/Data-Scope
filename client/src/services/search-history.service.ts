import { api } from '../lib/api';
import type { SearchHistoryItem } from '../types/history';
import type { PaginationMeta } from '../types/api';

type ListHistoryParams = {
  datasetId?: string;
  page?: number;
  pageSize?: number;
};

// Lists recent search queries executed by the user
export async function listHistory(params: ListHistoryParams = {}) {
  const query = new URLSearchParams();
  if (params.datasetId) query.set('datasetId', params.datasetId);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const qs = query.toString();
  const res = await api<SearchHistoryItem[]>(`/search-history${qs ? `?${qs}` : ''}`);
  return {
    data: res.data,
    meta: res.meta as PaginationMeta,
  };
}

// Hides a single search history entry from the user's list
export async function hideOne(id: string) {
  await api<void>(`/search-history/${id}`, {
    method: 'DELETE',
  });
}

// Clears all search history entries for the current user
export async function hideAll() {
  await api<void>('/search-history', {
    method: 'DELETE',
  });
}
