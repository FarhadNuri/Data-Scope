import { query, withTransaction } from '../../db/pool.js';
import * as datasetsModel from '../datasets/datasets.model.js';
import { calculateOffset } from '../../utils/pagination.js';

// Converts database row to camelCase API record shape
export function toRecord(row) {
  return {
    id: row.id,
    datasetId: row.dataset_id,
    data: row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Finds a record strictly scoped by both record ID and dataset ID
export async function findById(datasetId, recordId) {
  // Scoping to both id AND dataset_id prevents reading a record through another dataset's URL
  const sql = 'SELECT id, dataset_id, data, created_at, updated_at FROM dataset_records WHERE id = $1 AND dataset_id = $2';
  const result = await query(sql, [recordId, datasetId]);
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

// Finds related records where the given record is source or target, filtered by user visibility
export async function findRelated(recordId, accessibleDatasetIds = [], page = 1, pageSize = 10) {
  if (!accessibleDatasetIds || accessibleDatasetIds.length === 0) return { rows: [], totalItems: 0 };
  const offset = calculateOffset(page, pageSize);
  const dataSql = `WITH rels AS (
    SELECT id AS rel_id, relation_type, 'outgoing' AS direction, target_record_id AS related_id, created_at FROM record_relationships WHERE source_record_id = $1
    UNION ALL
    SELECT id AS rel_id, relation_type, 'incoming' AS direction, source_record_id AS related_id, created_at FROM record_relationships WHERE target_record_id = $1
  ) SELECT r.relation_type, r.direction, dr.id, dr.dataset_id, dr.data, dr.created_at, dr.updated_at FROM rels r
  JOIN dataset_records dr ON dr.id = r.related_id WHERE dr.dataset_id = ANY($2) ORDER BY r.created_at DESC, r.rel_id ASC LIMIT $3 OFFSET $4`;

  const countSql = `WITH rels AS (
    SELECT target_record_id AS related_id FROM record_relationships WHERE source_record_id = $1
    UNION ALL SELECT source_record_id AS related_id FROM record_relationships WHERE target_record_id = $1
  ) SELECT count(*) FROM rels r JOIN dataset_records dr ON dr.id = r.related_id WHERE dr.dataset_id = ANY($2)`;

  const [rowsResult, countResult] = await Promise.all([
    query(dataSql, [recordId, accessibleDatasetIds, pageSize, offset]),
    query(countSql, [recordId, accessibleDatasetIds]),
  ]);
  const rows = rowsResult.rows.map((row) => ({ relationType: row.relation_type, direction: row.direction, record: toRecord(row) }));
  return { rows, totalItems: parseInt(countResult.rows[0].count, 10) };
}

// Finds change audit history for a specific record
export async function findHistory(recordId, page = 1, pageSize = 10) {
  const offset = calculateOffset(page, pageSize);

  const dataSql = `
    SELECT rh.id, rh.record_id, rh.changed_by, u.name AS user_name, rh.old_data, rh.new_data, rh.changed_at
    FROM record_history rh
    LEFT JOIN users u ON u.id = rh.changed_by
    WHERE rh.record_id = $1
    ORDER BY rh.changed_at DESC, rh.id DESC
    LIMIT $2 OFFSET $3
  `;

  const countSql = `SELECT count(*) FROM record_history WHERE record_id = $1`;

  const [rowsResult, countResult] = await Promise.all([
    query(dataSql, [recordId, pageSize, offset]),
    query(countSql, [recordId]),
  ]);

  const rows = rowsResult.rows.map((r) => ({
    id: r.id,
    recordId: r.record_id,
    changedBy: { id: r.changed_by, name: r.user_name || 'System' },
    oldData: r.old_data,
    newData: r.new_data,
    changedAt: r.changed_at,
  }));

  const totalItems = parseInt(countResult.rows[0].count, 10);
  return { rows, totalItems };
}

// Inserts a new record and increments total_records atomically inside a transaction
export async function createRecord(datasetId, data, searchText) {
  return withTransaction(async (client) => {
    const res = await client.query(
      `INSERT INTO dataset_records (dataset_id, data, search_text)
       VALUES ($1, $2, $3)
       RETURNING id, dataset_id, data, created_at, updated_at`,
      [datasetId, data, searchText]
    );

    await datasetsModel.adjustTotalRecords(datasetId, 1, client);
    return toRecord(res.rows[0]);
  });
}

// Updates an existing record and writes an audit history entry atomically inside a transaction
export async function updateRecordWithHistory(datasetId, recordId, userId, oldData, newData, searchText) {
  return withTransaction(async (client) => {
    const updateRes = await client.query(
      `UPDATE dataset_records
       SET data = $1, search_text = $2, updated_at = now()
       WHERE id = $3 AND dataset_id = $4
       RETURNING id, dataset_id, data, created_at, updated_at`,
      [newData, searchText, recordId, datasetId]
    );

    await client.query(
      `INSERT INTO record_history (record_id, changed_by, old_data, new_data)
       VALUES ($1, $2, $3, $4)`,
      [recordId, userId, oldData, newData]
    );

    return toRecord(updateRes.rows[0]);
  });
}

// Deletes a record, writes a deletion history entry, and decrements total_records atomically
export async function deleteRecordWithHistory(datasetId, recordId, userId, oldData) {
  return withTransaction(async (client) => {
    await client.query(
      `INSERT INTO record_history (record_id, changed_by, old_data, new_data)
       VALUES ($1, $2, $3, NULL)`,
      [recordId, userId, oldData]
    );

    await client.query(
      `DELETE FROM dataset_records WHERE id = $1 AND dataset_id = $2`,
      [recordId, datasetId]
    );

    await datasetsModel.adjustTotalRecords(datasetId, -1, client);
  });
}

// Fetches a batch of records ordered by ID for keyset pagination during search_text rebuilds
export async function findBatchForSearchTextRebuild(datasetId, lastId, limit = 1000) {
  const sql = 'SELECT id, data FROM dataset_records WHERE dataset_id = $1 AND ($2::uuid IS NULL OR id > $2) ORDER BY id ASC LIMIT $3';
  const result = await query(sql, [datasetId, lastId, limit]);
  return result.rows;
}

// Updates search_text on a single record
export async function updateSearchTextSingle(recordId, searchText) {
  await query(`UPDATE dataset_records SET search_text = $1 WHERE id = $2`, [searchText, recordId]);
}
