import { query } from '../../db/pool.js';

// Retrieves the stored preferences JSON object for a user, or null if no row exists
export async function findByUserId(userId) {
  const result = await query(
    'SELECT preferences FROM user_preferences WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] ? result.rows[0].preferences : null;
}

// Inserts or updates preferences for a user using an atomic upsert
export async function upsert(userId, preferences) {
  const sql = `
    INSERT INTO user_preferences (user_id, preferences, updated_at)
    VALUES ($1, $2, now())
    ON CONFLICT (user_id) DO UPDATE
    SET preferences = $2, updated_at = now()
    RETURNING preferences
  `;
  const result = await query(sql, [userId, preferences]);
  return result.rows[0].preferences;
}
