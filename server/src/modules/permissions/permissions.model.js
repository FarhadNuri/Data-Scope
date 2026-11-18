import { query, withTransaction } from '../../db/pool.js';

// Checks if a dataset exists in the database
export async function datasetExists(datasetId) {
  const result = await query('SELECT 1 FROM datasets WHERE id = $1', [datasetId]);
  return (result.rowCount ?? result.rows.length) > 0;
}

// Retrieves all granted permissions for a dataset, including user names and emails
export async function findDatasetPermissions(datasetId) {
  const result = await query(
    `SELECT p.user_id, u.name, u.email, p.level
     FROM access_permissions p
     JOIN users u ON u.id = p.user_id
     WHERE p.dataset_id = $1
     ORDER BY u.name ASC`,
    [datasetId]
  );

  return result.rows.map((row) => ({
    userId: row.user_id,
    name: row.name,
    email: row.email,
    level: row.level,
  }));
}

// Retrieves a specific user's permission level for a given dataset ('view', 'manage', or null)
export async function getUserPermission(datasetId, userId) {
  const result = await query(
    'SELECT level FROM access_permissions WHERE dataset_id = $1 AND user_id = $2',
    [datasetId, userId]
  );
  const row = result.rows[0];
  return row ? row.level : null;
}

// Lists all dataset IDs accessible to a specific non-admin user
export async function listUserAccessibleDatasetIds(userId) {
  const result = await query(
    'SELECT dataset_id FROM access_permissions WHERE user_id = $1',
    [userId]
  );
  return result.rows.map((row) => row.dataset_id);
}

// Lists all dataset IDs in the system (used for Admins who have access to all datasets)
export async function listAllDatasetIds() {
  const result = await query('SELECT id FROM datasets');
  return result.rows.map((row) => row.id);
}

// Replaces all permissions for a dataset within a single atomic database transaction
export async function replacePermissions(datasetId, permissionsList) {
  return withTransaction(async (client) => {
    // 1. Remove existing dataset permissions
    await client.query('DELETE FROM access_permissions WHERE dataset_id = $1', [datasetId]);

    // 2. Insert updated permission assignments
    for (const item of permissionsList) {
      await client.query(
        `INSERT INTO access_permissions (dataset_id, user_id, level)
         VALUES ($1, $2, $3)`,
        [datasetId, item.userId, item.level]
      );
    }

    // 3. Return the newly saved permissions with user display details
    const result = await client.query(
      `SELECT p.user_id, u.name, u.email, p.level
       FROM access_permissions p
       JOIN users u ON u.id = p.user_id
       WHERE p.dataset_id = $1
       ORDER BY u.name ASC`,
      [datasetId]
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      name: row.name,
      email: row.email,
      level: row.level,
    }));
  });
}

// Removes a single user's permission from a dataset
export async function deletePermission(datasetId, userId) {
  await query(
    'DELETE FROM access_permissions WHERE dataset_id = $1 AND user_id = $2',
    [datasetId, userId]
  );
}
