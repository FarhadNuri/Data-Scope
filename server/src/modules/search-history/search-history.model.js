import { query } from '../../db/pool.js';

// Converts database row to the public search history item format
function toHistoryItem(row) {
  return {
    id: row.id,
    datasetId: row.dataset_id,
    datasetName: row.dataset_name,
    config: row.config,
    resultCount: row.result_count,
    tookMs: row.took_ms,
    createdAt: row.created_at,
  };
}

// Inserts an executed search query record
export async function insert({ userId, datasetId, config, configHash, resultCount, tookMs }) {
  const result = await query(
    `INSERT INTO search_history (
      user_id, dataset_id, config, config_hash, result_count, took_ms
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [userId, datasetId, JSON.stringify(config), configHash, resultCount, tookMs]
  );
  return result.rows[0];
}

// Finds distinct search queries for a user with pagination and latest-run ordering.
// STEP-BY-STEP SQL EXPLANATION:
// 1. Inner CTE (distinct_queries): Uses PostgreSQL DISTINCT ON (h.dataset_id, h.config_hash)
//    combined with "ORDER BY h.dataset_id, h.config_hash, h.created_at DESC" to pick exactly ONE
//    row—the most recently executed one—for every unique query configuration on a dataset.
// 2. JOIN datasets: Pulls in the current dataset name for clear UI display.
// 3. WHERE filter: Excludes hidden rows (is_hidden = false) and scopes to the current user (and optional dataset).
// 4. Outer query: Re-sorts the deduplicated set by "created_at DESC" so newest searches appear first,
//    and applies LIMIT / OFFSET for pagination.
export async function findDistinctByUser(userId, { datasetId, limit, offset }) {
  const params = [userId];
  let datasetFilter = '';

  if (datasetId) {
    params.push(datasetId);
    datasetFilter = `AND h.dataset_id = $${params.length}`;
  }

  params.push(limit, offset);
  const limitIndex = params.length - 1;
  const offsetIndex = params.length;

  const sql = `
    WITH distinct_queries AS (
      SELECT DISTINCT ON (h.dataset_id, h.config_hash)
        h.id,
        h.dataset_id,
        h.config,
        h.result_count,
        h.took_ms,
        h.created_at,
        d.name AS dataset_name
      FROM search_history h
      JOIN datasets d ON d.id = h.dataset_id
      WHERE h.user_id = $1 AND h.is_hidden = false ${datasetFilter}
      ORDER BY h.dataset_id, h.config_hash, h.created_at DESC
    )
    SELECT *
    FROM distinct_queries
    ORDER BY created_at DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex};
  `;

  const result = await query(sql, params);
  return result.rows.map(toHistoryItem);
}

// Counts total distinct visible queries matching user criteria
export async function countDistinctByUser(userId, { datasetId }) {
  const params = [userId];
  let datasetFilter = '';

  if (datasetId) {
    params.push(datasetId);
    datasetFilter = `AND dataset_id = $${params.length}`;
  }

  const sql = `
    SELECT COUNT(DISTINCT (dataset_id, config_hash)) AS total
    FROM search_history
    WHERE user_id = $1 AND is_hidden = false ${datasetFilter};
  `;

  const result = await query(sql, params);
  return parseInt(result.rows[0].total, 10);
}

// Finds a single history record belonging to a user
export async function findUserRowById(id, userId) {
  const result = await query(
    'SELECT id, dataset_id, config_hash FROM search_history WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0] || null;
}

// Hides all history entries matching a user's specific query configuration.
// NO CLEANUP JOB: We intentionally do NOT delete rows from the table; we only set
// is_hidden = true. The rows are permanently preserved so system analytics can continue
// calculating overall search frequency and top-filter aggregations.
export async function hideByConfigHash(userId, datasetId, configHash) {
  await query(
    `UPDATE search_history
     SET is_hidden = true
     WHERE user_id = $1 AND dataset_id = $2 AND config_hash = $3`,
    [userId, datasetId, configHash]
  );
}

// Hides all history entries for a user (clear history).
// Rows remain in the database for analytics.
export async function hideAllByUser(userId) {
  await query(
    `UPDATE search_history
     SET is_hidden = true
     WHERE user_id = $1 AND is_hidden = false`,
    [userId]
  );
}
