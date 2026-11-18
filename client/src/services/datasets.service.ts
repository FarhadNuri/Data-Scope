import { api } from '../lib/api';
import type { Dataset, DatasetWithFields, DatasetField, FieldType } from '../types/dataset';
import type { PaginationMeta } from '../types/api';

type ListDatasetsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
};

// Lists all datasets accessible to the current user
export async function listDatasets(params: ListDatasetsParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);

  const qs = query.toString();
  const res = await api<Dataset[]>(`/datasets${qs ? `?${qs}` : ''}`);
  return {
    data: res.data,
    meta: res.meta as PaginationMeta,
  };
}

// Retrieves a single dataset with its configured schema fields
export async function getDataset(datasetId: string) {
  const res = await api<DatasetWithFields>(`/datasets/${datasetId}`);
  return res.data;
}

// Retrieves the list of field definitions for a dataset
export async function getFields(datasetId: string) {
  const res = await api<DatasetField[]>(`/datasets/${datasetId}/fields`);
  return res.data;
}

// Retrieves distinct categorical values for a select field
export async function getFieldValues(
  datasetId: string,
  fieldId: string,
  search?: string,
  limit = 50
) {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (limit) query.set('limit', String(limit));

  const qs = query.toString();
  const res = await api<string[]>(
    `/datasets/${datasetId}/fields/${fieldId}/values${qs ? `?${qs}` : ''}`
  );
  return res.data;
}

// Creates a new dataset (Admin only)
export async function createDataset(body: {
  name: string;
  description?: string;
  category?: string;
  dataSource?: string;
}) {
  const res = await api<Dataset>('/datasets', {
    method: 'POST',
    body,
  });
  return res.data;
}

// Updates an existing dataset's metadata (Admin only)
export async function updateDataset(
  id: string,
  body: {
    name?: string;
    description?: string;
    category?: string;
    dataSource?: string;
  }
) {
  const res = await api<Dataset>(`/datasets/${id}`, {
    method: 'PATCH',
    body,
  });
  return res.data;
}

// Deletes a dataset, cascading to records and permissions (Admin only)
export async function deleteDataset(id: string) {
  await api<void>(`/datasets/${id}`, {
    method: 'DELETE',
  });
}

// Adds a new schema field definition to a dataset (Admin only)
export async function createField(
  datasetId: string,
  body: {
    key: string;
    label: string;
    type: FieldType;
    isFilterable?: boolean;
    isSortable?: boolean;
    isSearchable?: boolean;
  }
) {
  const res = await api<DatasetField>(`/datasets/${datasetId}/fields`, {
    method: 'POST',
    body,
  });
  return res.data;
}

// Updates an existing schema field's label and search flags (Admin only)
export async function updateField(
  datasetId: string,
  fieldId: string,
  body: {
    label?: string;
    isFilterable?: boolean;
    isSortable?: boolean;
    isSearchable?: boolean;
  }
) {
  const res = await api<DatasetField>(`/datasets/${datasetId}/fields/${fieldId}`, {
    method: 'PATCH',
    body,
  });
  return res.data;
}

// Deletes a schema field from a dataset (Admin only)
export async function deleteField(datasetId: string, fieldId: string) {
  await api<void>(`/datasets/${datasetId}/fields/${fieldId}`, {
    method: 'DELETE',
  });
}
