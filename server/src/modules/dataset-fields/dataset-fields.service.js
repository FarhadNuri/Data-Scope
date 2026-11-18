import * as datasetFieldsModel from './dataset-fields.model.js';
import { HttpError } from '../../utils/http-error.js';

// Retrieves all field definitions for a dataset, ordered by position
export async function getFieldsByDatasetId(datasetId) {
  return datasetFieldsModel.findByDatasetId(datasetId);
}

// Retrieves a specific field definition by its key within a dataset
export async function getFieldByKey(datasetId, key) {
  return datasetFieldsModel.findByKey(datasetId, key);
}

// Creates a new field definition in a dataset
export async function createField(datasetId, fieldData) {
  // Check for key uniqueness within the dataset
  const existing = await datasetFieldsModel.findByKey(datasetId, fieldData.key);
  if (existing) {
    throw new HttpError(409, `Field with key "${fieldData.key}" already exists in this dataset`);
  }

  // Assign the next available sequence position
  const position = await datasetFieldsModel.getNextPosition(datasetId);

  return datasetFieldsModel.create({
    datasetId,
    ...fieldData,
    position,
  });
}

// Updates mutable attributes of an existing field
export async function updateField(datasetId, fieldId, updates) {
  // Ensure the field exists and belongs strictly to the requested dataset
  const field = await datasetFieldsModel.findByIdAndDatasetId(fieldId, datasetId);
  if (!field) {
    throw new HttpError(404, 'Field not found in this dataset');
  }

  // NOTE (Prompt 13): Rebuilding search_text for dataset records when isSearchable
  // changes is orchestrated by dataset-fields.controller.js to avoid a circular
  // dependency between dataset-fields.service and records.service.
  return datasetFieldsModel.update(fieldId, datasetId, updates);
}

// Deletes a field definition from a dataset
export async function deleteField(datasetId, fieldId) {
  const field = await datasetFieldsModel.findByIdAndDatasetId(fieldId, datasetId);
  if (!field) {
    throw new HttpError(404, 'Field not found in this dataset');
  }

  await datasetFieldsModel.deleteById(fieldId, datasetId);
}

// Retrieves distinct values for a select-type field to populate UI dropdown filter options
export async function getFieldValues(datasetId, fieldId, { search, limit }) {
  const field = await datasetFieldsModel.findByIdAndDatasetId(fieldId, datasetId);
  if (!field) {
    throw new HttpError(404, 'Field not found in this dataset');
  }

  // Only fields of type 'select' support distinct value lookup
  if (field.type !== 'select') {
    throw new HttpError(400, 'Distinct values can only be retrieved for fields of type "select"');
  }

  return datasetFieldsModel.findDistinctValues(datasetId, field.key, search, limit);
}
