import { query } from '../../db/pool.js';
import { calculateOffset } from '../../utils/pagination.js';
import { escapeLike } from '../../utils/escape-like.js';

// Converts database row to camelCase API representation
function toDataset(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    dataSource: row.data_source,
    totalRecords: row.total_records,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Finds a dataset by its primary key ID
export async function findById(id) {
  const result = await query('SELECT * FROM datasets WHERE id = $1', [id]);
  const row = result.rows[0];
  return row ? toDataset(row) : null;
}

// Inserts a new dataset record
export async function create({ name, description, category, dataSource, createdBy }) {
  const result = await query(
    `INSERT INTO datasets (name, description, category, data_source, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description ?? null, category, dataSource, createdBy]
  );
  return toDataset(result.rows[0]);
}

// Updates mutable dataset metadata
export async function update(id, { name, description, category, dataSource }) {
  const updates = [];
  const params = [id];

  if (name !== undefined) {
    params.push(name);
    updates.push(`name = $${params.length}`);
  }

  if (description !== undefined) {
    params.push(description);
    updates.push(`description = $${params.length}`);
  }

  if (category !== undefined) {
    params.push(category);
    updates.push(`category = $${params.length}`);
  }

  if (dataSource !== undefined) {
    params.push(dataSource);
    updates.push(`data_source = $${params.length}`);
  }

  updates.push('updated_at = now()');

  const result = await query(
    `UPDATE datasets
     SET ${updates.join(', ')}
     WHERE id = $1
     RETURNING *`,
    params
  );

  const row = result.rows[0];
  return row ? toDataset(row) : null;
}

// Deletes a dataset by ID (cascades to records, fields, permissions, saved views)
export async function deleteById(id) {
  const result = await query('DELETE FROM datasets WHERE id = $1', [id]);
  return (result.rowCount ?? result.rows.length) > 0;
}

// Retrieves paginated list of datasets with optional search, category, and authorization filter
export async function findMany({
  page,
  pageSize,
  search,
  category,
  accessibleIds,
  isAdmin = false,
}) {
  const conditions = [];
  const params = [];

  // Non-admin users can only see datasets explicitly granted to them
  if (!isAdmin) {
    params.push(accessibleIds);
    conditions.push(`id = ANY($${params.length})`);
  }

  if (search) {
    const escaped = escapeLike(search);
    params.push(`%${escaped}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 1. Total count query
  const countResult = await query(`SELECT COUNT(*) FROM datasets ${whereClause}`, params);
  const totalItems = parseInt(countResult.rows[0].count, 10);

  // 2. Paginated rows query
  const offset = calculateOffset(page, pageSize);
  const queryParams = [...params, pageSize, offset];
  const rowsResult = await query(
    `SELECT * FROM datasets ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
    queryParams
  );

  return {
    datasets: rowsResult.rows.map(toDataset),
    totalItems,
  };
}

// Adjusts the total_records count by delta (+1 on insert, -1 on delete).
// WHY: We use an atomic database-level arithmetic expression (total_records = total_records + $1)
// rather than reading the count in Node and writing it back. This prevents race conditions and
// lost updates when multiple records are created or deleted concurrently.
// Accepts an optional transaction client so it can run inside callers' transactions.
export async function adjustTotalRecords(datasetId, delta, client = null) {
  const executor = client || { query };
  const result = await executor.query(
    `UPDATE datasets
     SET total_records = GREATEST(0, total_records + $1),
         updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [delta, datasetId]
  );
  const row = result.rows[0];
  return row ? toDataset(row) : null;
}

// Recalculates total_records from actual dataset_records row count.
// Used by seed generators and batch maintenance utilities.
export async function recalculateTotalRecords(datasetId, client = null) {
  const executor = client || { query };
  const result = await executor.query(
    `UPDATE datasets
     SET total_records = (SELECT COUNT(*) FROM dataset_records WHERE dataset_id = $1),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [datasetId]
  );
  const row = result.rows[0];
  return row ? toDataset(row) : null;
}
