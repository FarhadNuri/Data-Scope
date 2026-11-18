import * as datasetsService from './datasets.service.js';
import {
  validateCreateDataset,
  validateUpdateDataset,
  validateListDatasetsQuery,
} from './datasets.validation.js';
import { parsePagination } from '../../utils/pagination.js';
import { isUuid } from '../../utils/validate.js';
import { HttpError } from '../../utils/http-error.js';

// GET /api/v1/datasets
export async function listDatasets(req, res) {
  const pagination = parsePagination(req.query);
  const filters = validateListDatasetsQuery(req.query);

  const { datasets, meta } = await datasetsService.listDatasets(
    { ...pagination, ...filters },
    req.user
  );

  res.status(200).json({
    success: true,
    data: datasets,
    meta,
  });
}

// POST /api/v1/datasets
export async function createDataset(req, res) {
  const validatedBody = validateCreateDataset(req.body);
  const dataset = await datasetsService.createDataset(validatedBody, req.user);

  res.status(201).json({
    success: true,
    data: dataset,
  });
}

// GET /api/v1/datasets/:id
export async function getDataset(req, res) {
  if (!isUuid(req.params.id)) {
    throw new HttpError(400, 'Invalid dataset ID format');
  }

  const dataset = await datasetsService.getDatasetById(req.params.id);

  res.status(200).json({
    success: true,
    data: dataset,
  });
}

// PATCH /api/v1/datasets/:id
export async function updateDataset(req, res) {
  if (!isUuid(req.params.id)) {
    throw new HttpError(400, 'Invalid dataset ID format');
  }

  const updates = validateUpdateDataset(req.body);
  const updatedDataset = await datasetsService.updateDataset(req.params.id, updates);

  res.status(200).json({
    success: true,
    data: updatedDataset,
  });
}

// DELETE /api/v1/datasets/:id
export async function deleteDataset(req, res) {
  if (!isUuid(req.params.id)) {
    throw new HttpError(400, 'Invalid dataset ID format');
  }

  await datasetsService.deleteDataset(req.params.id);

  res.status(204).end();
}
