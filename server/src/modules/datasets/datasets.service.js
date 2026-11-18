import * as datasetsModel from './datasets.model.js';
import * as datasetFieldsService from '../dataset-fields/dataset-fields.service.js';
import * as permissionsService from '../permissions/permissions.service.js';
import { HttpError } from '../../utils/http-error.js';
import { buildPaginationMeta } from '../../utils/pagination.js';

// Lists datasets accessible to the current user (Admins see all; others see authorized only)
export async function listDatasets({ page, pageSize, search, category }, user) {
  const isAdmin = user && user.role === 'ADMIN';

  if (!isAdmin) {
    const accessibleIds = await permissionsService.listAccessibleDatasetIds(user);
    if (accessibleIds.length === 0) {
      return {
        datasets: [],
        meta: buildPaginationMeta(page, pageSize, 0),
      };
    }

    const { datasets, totalItems } = await datasetsModel.findMany({
      page,
      pageSize,
      search,
      category,
      accessibleIds,
      isAdmin: false,
    });

    return {
      datasets,
      meta: buildPaginationMeta(page, pageSize, totalItems),
    };
  }

  const { datasets, totalItems } = await datasetsModel.findMany({
    page,
    pageSize,
    search,
    category,
    isAdmin: true,
  });

  return {
    datasets,
    meta: buildPaginationMeta(page, pageSize, totalItems),
  };
}

// Retrieves single dataset along with its configured field definitions
export async function getDatasetById(datasetId) {
  const dataset = await datasetsModel.findById(datasetId);
  if (!dataset) {
    throw new HttpError(404, 'Dataset not found');
  }

  const fields = await datasetFieldsService.getFieldsByDatasetId(datasetId);
  return {
    ...dataset,
    fields,
  };
}

// Creates a new dataset (Admin only, creator bound from token)
export async function createDataset(body, user) {
  return datasetsModel.create({
    ...body,
    createdBy: user.id,
  });
}

// Updates mutable dataset metadata (Admin only)
export async function updateDataset(datasetId, updates) {
  const dataset = await datasetsModel.findById(datasetId);
  if (!dataset) {
    throw new HttpError(404, 'Dataset not found');
  }

  return datasetsModel.update(datasetId, updates);
}

// Deletes a dataset (cascades to records, fields, permissions, views)
export async function deleteDataset(datasetId) {
  const dataset = await datasetsModel.findById(datasetId);
  if (!dataset) {
    throw new HttpError(404, 'Dataset not found');
  }

  await datasetsModel.deleteById(datasetId);
}
