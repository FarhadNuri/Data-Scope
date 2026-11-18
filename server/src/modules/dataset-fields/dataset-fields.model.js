import { query } from '../../db/pool.js';
import { escapeLike } from '../../utils/escape-like.js';

// Converts a database row to camelCase API shape
function toField(row) {
  return {
    id: row.id,
    datasetId: row.dataset_id,
    key: row.key,
    label: row.label,
    type: row.type,
    isFilterable: row.is_filterable,
    isSortable: row.is_sortable,
    isSearchable: row.is_searchable,
    position: row.position,
    createdAt: row.created_at,
  };
}

// Retrieves all fields for a dataset ordered by their UI display position
export async function findByDatasetId(datasetId) {
  const result = await query(
    'SELECT * FROM dataset_fields WHERE dataset_id = $1 ORDER BY position ASC',
    [datasetId]
  );
  return result.rows.map(toField);
}

// Retrieves a single field definition by its key within a dataset
export async function findByKey(datasetId, key) {
  const result = await query(
    'SELECT * FROM dataset_fields WHERE dataset_id = $1 AND key = $2',
    [datasetId, key]
  );
  const row = result.rows[0];
  return row ? toField(row) : null;
}

// Retrieves a field by its ID, verifying it belongs to the specified dataset
export async function findByIdAndDatasetId(id, datasetId) {
  const result = await query(
    'SELECT * FROM dataset_fields WHERE id = $1 AND dataset_id = $2',
    [id, datasetId]
  );
  const row = result.rows[0];
  return row ? toField(row) : null;
}

// Calculates the next available position index for fields in a dataset
export async function getNextPosition(datasetId) {
  const result = await query(
    'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM dataset_fields WHERE dataset_id = $1',
    [datasetId]
  );
  return parseInt(result.rows[0].next_pos, 10);
}

// Inserts a new field definition
export async function create({
  datasetId,
  key,
  label,
  type,
  isFilterable = true,
  isSortable = true,
  isSearchable = false,
  position = 0,
}) {
  const result = await query(
    `INSERT INTO dataset_fields (
      dataset_id, key, label, type, is_filterable, is_sortable, is_searchable, position
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [datasetId, key, label, type, isFilterable, isSortable, isSearchable, position]
  );
  return toField(result.rows[0]);
}

// Updates an existing field's mutable attributes
export async function update(id, datasetId, { label, isFilterable, isSortable, isSearchable }) {
  const updates = [];
  const params = [id, datasetId];

  if (label !== undefined) {
    params.push(label);
    updates.push(`label = $${params.length}`);
  }

  if (isFilterable !== undefined) {
    params.push(isFilterable);
    updates.push(`is_filterable = $${params.length}`);
  }

  if (isSortable !== undefined) {
    params.push(isSortable);
    updates.push(`is_sortable = $${params.length}`);
  }

  if (isSearchable !== undefined) {
    params.push(isSearchable);
    updates.push(`is_searchable = $${params.length}`);
  }

  const result = await query(
    `UPDATE dataset_fields
     SET ${updates.join(', ')}
     WHERE id = $1 AND dataset_id = $2
     RETURNING *`,
    params
  );

  const row = result.rows[0];
  return row ? toField(row) : null;
}

// Deletes a field definition from a dataset
export async function deleteById(id, datasetId) {
  const result = await query(
    'DELETE FROM dataset_fields WHERE id = $1 AND dataset_id = $2',
    [id, datasetId]
  );
  return (result.rowCount ?? result.rows.length) > 0;
}

// Retrieves distinct values for a select field from dataset records.
// WHY: We pass fieldKey as a SQL parameter ($2) to the JSONB accessor (data->>$2)
// to ensure complete safety and prevent SQL injection attacks.
export async function findDistinctValues(datasetId, fieldKey, search, limit = 50) {
  const conditions = [
    'dataset_id = $1',
    'data->>$2 IS NOT NULL',
    "data->>$2 <> ''",
  ];
  const params = [datasetId, fieldKey];

  if (search && typeof search === 'string' && search.trim() !== '') {
    const escaped = escapeLike(search.trim());
    params.push(`%${escaped}%`);
    conditions.push(`data->>$2 ILIKE $${params.length}`);
  }

  params.push(limit);
  const limitParamIndex = params.length;

  const result = await query(
    `SELECT DISTINCT data->>$2 AS value
     FROM dataset_records
     WHERE ${conditions.join(' AND ')}
     ORDER BY value ASC
     LIMIT $${limitParamIndex}`,
    params
  );

  return result.rows.map((row) => row.value);
}
