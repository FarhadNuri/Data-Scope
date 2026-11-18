import { api } from '../lib/api';
import type { DataRecord, RecordHistoryItem, RelatedRecord } from '../types/record';
import type { SearchRequest } from '../types/search';
import type { PaginationMeta } from '../types/api';

// Dispatches search request to the backend with filters, sort, and pagination
export async function searchRecords(datasetId: string, body: SearchRequest) {
  const res = await api<DataRecord[]>(`/datasets/${datasetId}/records/search`, {
    method: 'POST',
    body,
  });

  return {
    data: res.data,
    meta: res.meta as PaginationMeta,
  };
}

// Validates a search configuration against the dataset's fields without running the query
export async function validateSearch(datasetId: string, body: SearchRequest) {
  const res = await api<{
    valid: boolean;
    errors?: { path?: string; message: string }[];
  }>(`/datasets/${datasetId}/records/search/validate`, {
    method: 'POST',
    body,
  });
  return res.data;
}

// Fetches a single complete record by dataset ID and record ID
export async function getRecord(datasetId: string, recordId: string) {
  const res = await api<DataRecord>(`/datasets/${datasetId}/records/${recordId}`);
  return res.data;
}

// Loads relationships (incoming and outgoing) for a specific record
export async function getRelated(
  datasetId: string,
  recordId: string,
  page = 1,
  pageSize = 10
) {
  const res = await api<RelatedRecord[]>(
    `/datasets/${datasetId}/records/${recordId}/related?page=${page}&pageSize=${pageSize}`
  );
  return {
    data: res.data,
    meta: res.meta as PaginationMeta,
  };
}

// Loads the audit history of changes made to a specific record
export async function getHistory(
  datasetId: string,
  recordId: string,
  page = 1,
  pageSize = 10
) {
  const res = await api<RecordHistoryItem[]>(
    `/datasets/${datasetId}/records/${recordId}/history?page=${page}&pageSize=${pageSize}`
  );
  return {
    data: res.data,
    meta: res.meta as PaginationMeta,
  };
}

// Creates a new record in a dataset (requires manage permission or Admin)
export async function createRecord(datasetId: string, data: Record<string, unknown>) {
  const res = await api<DataRecord>(`/datasets/${datasetId}/records`, {
    method: 'POST',
    body: { data },
  });
  return res.data;
}

// Updates an existing record with only the changed keys (requires manage or Admin)
export async function updateRecord(
  datasetId: string,
  recordId: string,
  data: Record<string, unknown>
) {
  const res = await api<DataRecord>(`/datasets/${datasetId}/records/${recordId}`, {
    method: 'PATCH',
    body: { data },
  });
  return res.data;
}

// Permanently deletes a record (requires manage or Admin)
export async function deleteRecord(datasetId: string, recordId: string) {
  await api<void>(`/datasets/${datasetId}/records/${recordId}`, {
    method: 'DELETE',
  });
}
