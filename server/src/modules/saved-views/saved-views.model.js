import { query } from '../../db/pool.js';

// Converts database row to camelCase API representation
export function toView(row, currentUserId = null) {
  const isOwner = currentUserId ? row.owner_id === currentUserId : undefined;
  return {
    id: row.id,
    name: row.name,
    datasetId: row.dataset_id,
    config: row.config,
    owner: {
      id: row.owner_id,
      name: row.owner_name || 'Unknown',
    },
    isShared: isOwner !== undefined ? !isOwner : Boolean(row.is_shared),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Finds a view by primary key ID with owner details
export async function findById(id) {
  const sql = 'SELECT sv.id, sv.owner_id, u.name AS owner_name, sv.dataset_id, sv.name, sv.config, sv.created_at, sv.updated_at FROM saved_views sv JOIN users u ON u.id = sv.owner_id WHERE sv.id = $1';
  const result = await query(sql, [id]);
  return result.rows[0] ? toView(result.rows[0]) : null;
}

// Checks if a view is shared with a given user
export async function isSharedWith(viewId, userId) {
  const result = await query('SELECT 1 FROM saved_view_shares WHERE saved_view_id = $1 AND user_id = $2', [viewId, userId]);
  return result.rowCount > 0;
}

// Checks for duplicate view name on the same dataset for the same user
export async function findByNameAndDataset(ownerId, datasetId, name, excludeId = null) {
  const sql = 'SELECT id FROM saved_views WHERE owner_id = $1 AND dataset_id = $2 AND lower(name) = lower($3) AND ($4::uuid IS NULL OR id <> $4)';
  const result = await query(sql, [ownerId, datasetId, name, excludeId]);
  return result.rows[0] || null;
}

// Creates a new saved view
export async function create({ ownerId, datasetId, name, config }) {
  const sql = 'INSERT INTO saved_views (owner_id, dataset_id, name, config) VALUES ($1, $2, $3, $4) RETURNING id, owner_id, dataset_id, name, config, created_at, updated_at';
  const result = await query(sql, [ownerId, datasetId, name, config]);
  return toView(result.rows[0], ownerId);
}

// Updates mutable fields of a saved view
export async function update(id, { name, config }, currentUserId) {
  const updates = [];
  const params = [id];
  if (name !== undefined) { params.push(name); updates.push(`name = $${params.length}`); }
  if (config !== undefined) { params.push(config); updates.push(`config = $${params.length}`); }
  updates.push('updated_at = now()');

  const sql = `UPDATE saved_views SET ${updates.join(', ')} WHERE id = $1 RETURNING id, owner_id, dataset_id, name, config, created_at, updated_at`;
  const result = await query(sql, params);
  return result.rows[0] ? toView(result.rows[0], currentUserId) : null;
}

// Deletes a saved view
export async function deleteById(id) {
  await query('DELETE FROM saved_views WHERE id = $1', [id]);
}

// Lists views accessible to a user (own and/or shared) filtered by dataset permissions
export async function findAccessibleViews(userId, accessibleDatasetIds = [], { datasetId, scope = 'all', limit, offset }) {
  if (!accessibleDatasetIds || accessibleDatasetIds.length === 0) return { rows: [], totalItems: 0 };

  const whereParts = [`sv.dataset_id = ANY($1)`];
  const params = [accessibleDatasetIds, userId];
  if (scope === 'mine') whereParts.push(`sv.owner_id = $2`);
  else if (scope === 'shared') whereParts.push(`sv.owner_id <> $2 AND svs.user_id = $2`);
  else whereParts.push(`(sv.owner_id = $2 OR svs.user_id = $2)`);

  if (datasetId) { params.push(datasetId); whereParts.push(`sv.dataset_id = $${params.length}`); }
  const whereClause = `WHERE ${whereParts.join(' AND ')}`;

  const dataSql = `SELECT DISTINCT sv.id, sv.owner_id, u.name AS owner_name, sv.dataset_id, sv.name, sv.config, sv.created_at, sv.updated_at, (sv.owner_id <> $2) AS is_shared
    FROM saved_views sv JOIN users u ON u.id = sv.owner_id LEFT JOIN saved_view_shares svs ON svs.saved_view_id = sv.id
    ${whereClause} ORDER BY sv.updated_at DESC, sv.id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const countSql = `SELECT count(DISTINCT sv.id) FROM saved_views sv LEFT JOIN saved_view_shares svs ON svs.saved_view_id = sv.id ${whereClause}`;

  const [rowsResult, countResult] = await Promise.all([
    query(dataSql, [...params, limit, offset]),
    query(countSql, params),
  ]);

  return {
    rows: rowsResult.rows.map((r) => toView(r, userId)),
    totalItems: parseInt(countResult.rows[0].count, 10),
  };
}

// Inserts share records for target user IDs
export async function addShares(viewId, userIds = []) {
  for (const uid of userIds) {
    await query('INSERT INTO saved_view_shares (saved_view_id, user_id) VALUES ($1, $2) ON CONFLICT (saved_view_id, user_id) DO NOTHING', [viewId, uid]);
  }
}

// Retrieves the list of users with whom a view is shared
export async function getShares(viewId) {
  const sql = 'SELECT u.id, u.name, u.email FROM saved_view_shares svs JOIN users u ON u.id = svs.user_id WHERE svs.saved_view_id = $1 ORDER BY u.name ASC';
  const result = await query(sql, [viewId]);
  return result.rows;
}

// Removes a share mapping
export async function removeShare(viewId, userId) {
  await query('DELETE FROM saved_view_shares WHERE saved_view_id = $1 AND user_id = $2', [viewId, userId]);
}
