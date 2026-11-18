import * as recordsModel from './records.model.js';
import * as datasetFieldsService from '../dataset-fields/dataset-fields.service.js';
import * as permissionsService from '../permissions/permissions.service.js';
import * as cacheService from '../../cache/cache.service.js';
import { validateRecordData } from './record-data.validation.js';
import { calculateChanges } from './calculate-changes.js';
import { buildSearchText } from './build-search-text.js';
import { buildPaginationMeta } from '../../utils/pagination.js';
import { HttpError } from '../../utils/http-error.js';

// Retrieves a single record, ensuring it belongs to the given dataset
export async function getRecord(datasetId, recordId) {
  const record = await recordsModel.findById(datasetId, recordId);
  if (!record) {
    throw new HttpError(404, 'Record not found in this dataset');
  }
  return record;
}

// Retrieves related records across accessible datasets
export async function getRelated(datasetId, recordId, user, { page = 1, pageSize = 10 } = {}) {
  await getRecord(datasetId, recordId);
  const accessibleDatasetIds = await permissionsService.listAccessibleDatasetIds(user);
  const { rows, totalItems } = await recordsModel.findRelated(recordId, accessibleDatasetIds, page, pageSize);
  const meta = buildPaginationMeta(page, pageSize, totalItems);
  return { data: rows, meta };
}

// Retrieves change audit history for a record, calculating diffs on the fly
export async function getHistory(datasetId, recordId, { page = 1, pageSize = 10 } = {}) {
  await getRecord(datasetId, recordId);
  const { rows, totalItems } = await recordsModel.findHistory(recordId, page, pageSize);

  const formattedRows = rows.map((r) => {
    const changes = r.newData === null
      ? Object.keys(r.oldData || {}).map((f) => ({ field: f, oldValue: r.oldData[f], newValue: null }))
      : calculateChanges(r.oldData, r.newData);

    return {
      id: r.id,
      changedBy: r.changedBy,
      changedAt: r.changedAt,
      changes,
    };
  });

  const meta = buildPaginationMeta(page, pageSize, totalItems);
  return { data: formattedRows, meta };
}

// Creates a new record in the dataset
export async function createRecord(datasetId, body, user) {
  const canManage = await permissionsService.canUserManageDataset(user, datasetId);
  if (!canManage) {
    throw new HttpError(403, 'You do not have permission to manage records in this dataset');
  }

  const fields = await datasetFieldsService.getFieldsByDatasetId(datasetId);
  const validatedData = validateRecordData(body.data, fields, { partial: false });
  const searchText = buildSearchText(validatedData, fields);

  const record = await recordsModel.createRecord(datasetId, validatedData, searchText);

  // CACHE INVALIDATION: Bumping the dataset version ensures all cached search results
  // and analytics for this dataset are immediately invalidated without key scanning
  await cacheService.bumpDatasetVersion(datasetId);
  return record;
}

// Updates an existing record with partial changes and logs change history
export async function updateRecord(datasetId, recordId, body, user) {
  const canManage = await permissionsService.canUserManageDataset(user, datasetId);
  if (!canManage) {
    throw new HttpError(403, 'You do not have permission to manage records in this dataset');
  }

  const existing = await recordsModel.findById(datasetId, recordId);
  if (!existing) {
    throw new HttpError(404, 'Record not found in this dataset');
  }

  const fields = await datasetFieldsService.getFieldsByDatasetId(datasetId);
  validateRecordData(body.data, fields, { partial: true });

  const mergedData = { ...existing.data, ...body.data };
  const searchText = buildSearchText(mergedData, fields);

  const updated = await recordsModel.updateRecordWithHistory(
    datasetId,
    recordId,
    user.id,
    existing.data,
    mergedData,
    searchText
  );

  // Invalidate cached searches and analytics
  await cacheService.bumpDatasetVersion(datasetId);
  return updated;
}

// Deletes a record from the dataset and logs a deletion history entry
export async function deleteRecord(datasetId, recordId, user) {
  const canManage = await permissionsService.canUserManageDataset(user, datasetId);
  if (!canManage) {
    throw new HttpError(403, 'You do not have permission to manage records in this dataset');
  }

  const existing = await recordsModel.findById(datasetId, recordId);
  if (!existing) {
    throw new HttpError(404, 'Record not found in this dataset');
  }

  await recordsModel.deleteRecordWithHistory(datasetId, recordId, user.id, existing.data);

  // Invalidate cached searches and analytics
  await cacheService.bumpDatasetVersion(datasetId);
}

// Rebuilds composite search_text for all dataset records in 1,000-row keyset batches
export async function rebuildSearchTextForDataset(datasetId) {
  const fields = await datasetFieldsService.getFieldsByDatasetId(datasetId);
  let lastId = null;

  while (true) {
    const batch = await recordsModel.findBatchForSearchTextRebuild(datasetId, lastId, 1000);
    if (batch.length === 0) break;

    for (const row of batch) {
      const searchText = buildSearchText(row.data, fields);
      await recordsModel.updateSearchTextSingle(row.id, searchText);
    }
    lastId = batch[batch.length - 1].id;
  }

  // Invalidate cached searches
  await cacheService.bumpDatasetVersion(datasetId);
}
