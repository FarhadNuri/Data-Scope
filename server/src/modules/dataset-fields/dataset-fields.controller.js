import * as datasetFieldsService from './dataset-fields.service.js';
import * as recordsService from '../records/records.service.js';
import {
  validateCreateField,
  validateUpdateField,
  parseValuesQuery,
} from './dataset-fields.validation.js';
import { isUuid } from '../../utils/validate.js';
import { HttpError } from '../../utils/http-error.js';

// GET /api/v1/datasets/:datasetId/fields
export async function getFields(req, res) {
  const fields = await datasetFieldsService.getFieldsByDatasetId(req.params.datasetId);
  res.status(200).json({
    success: true,
    data: fields,
  });
}

// POST /api/v1/datasets/:datasetId/fields
export async function createField(req, res) {
  const validatedBody = validateCreateField(req.body);
  const field = await datasetFieldsService.createField(req.params.datasetId, validatedBody);
  res.status(201).json({
    success: true,
    data: field,
  });
}

// PATCH /api/v1/datasets/:datasetId/fields/:fieldId
export async function updateField(req, res) {
  if (!isUuid(req.params.fieldId)) {
    throw new HttpError(400, 'Invalid field ID format');
  }

  const updates = validateUpdateField(req.body);
  const updatedField = await datasetFieldsService.updateField(
    req.params.datasetId,
    req.params.fieldId,
    updates
  );

  // If isSearchable attribute changed, rebuild composite search_text for this dataset
  if (updates.isSearchable !== undefined) {
    await recordsService.rebuildSearchTextForDataset(req.params.datasetId);
  }

  res.status(200).json({
    success: true,
    data: updatedField,
  });
}

// DELETE /api/v1/datasets/:datasetId/fields/:fieldId
export async function deleteField(req, res) {
  if (!isUuid(req.params.fieldId)) {
    throw new HttpError(400, 'Invalid field ID format');
  }

  await datasetFieldsService.deleteField(req.params.datasetId, req.params.fieldId);
  res.status(204).end();
}

// GET /api/v1/datasets/:datasetId/fields/:fieldId/values
export async function getFieldValues(req, res) {
  if (!isUuid(req.params.fieldId)) {
    throw new HttpError(400, 'Invalid field ID format');
  }

  const queryOptions = parseValuesQuery(req.query);
  const values = await datasetFieldsService.getFieldValues(
    req.params.datasetId,
    req.params.fieldId,
    queryOptions
  );

  res.status(200).json({
    success: true,
    data: values,
  });
}
