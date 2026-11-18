import { api } from '../lib/api';
import type {
  Overview,
  DatasetSummary,
  GrowthPoint,
  ActivityPoint,
  TopFilter,
} from '../types/analytics';

// Fetches platform-wide aggregation overview metrics (Admin only)
export async function getOverview() {
  const res = await api<Overview>('/analytics/overview');
  return res.data;
}

// Fetches category/status categorical distribution summaries for a dataset
export async function getSummary(datasetId: string) {
  const res = await api<DatasetSummary>(`/analytics/datasets/${datasetId}/summary`);
  return res.data;
}

// Fetches time-series record creation growth
export async function getGrowth(
  datasetId: string,
  params: { interval?: 'day' | 'week' | 'month'; from?: string; to?: string } = {}
) {
  const query = new URLSearchParams();
  if (params.interval) query.set('interval', params.interval);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);

  const qs = query.toString();
  const res = await api<GrowthPoint[]>(
    `/analytics/datasets/${datasetId}/growth${qs ? `?${qs}` : ''}`
  );
  return res.data;
}

// Fetches search query activity over recent days (scope: 'me' or Admin 'all')
export async function getSearchActivity(
  params: { days?: number; scope?: 'me' | 'all' } = {}
) {
  const query = new URLSearchParams();
  if (params.days) query.set('days', String(params.days));
  if (params.scope) query.set('scope', params.scope);

  const qs = query.toString();
  const res = await api<ActivityPoint[]>(
    `/analytics/search-activity${qs ? `?${qs}` : ''}`
  );
  return res.data;
}

// Fetches most frequently used filter conditions (scope: 'me' or Admin 'all')
export async function getTopFilters(
  params: { datasetId?: string; limit?: number; scope?: 'me' | 'all' } = {}
) {
  const query = new URLSearchParams();
  if (params.datasetId) query.set('datasetId', params.datasetId);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.scope) query.set('scope', params.scope);

  const qs = query.toString();
  const res = await api<TopFilter[]>(
    `/analytics/top-filters${qs ? `?${qs}` : ''}`
  );
  return res.data;
}
