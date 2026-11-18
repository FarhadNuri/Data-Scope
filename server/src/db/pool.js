import pg from 'pg';
import { env } from '../config/env.js';

// Single PostgreSQL connection pool shared across the entire application
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});

// Helper function to execute queries using the pool.
// WHY: We ALWAYS pass query parameters as a separate array ($1, $2, etc.)
// instead of concatenating strings with user input. The database driver safely
// escapes parameters, completely preventing SQL injection attacks.
export async function query(text, params = []) {
  return pool.query(text, params);
}

// Executes a callback within a managed database transaction.
// Automatically issues BEGIN, commits on success, rolls back on error,
// and ensures the client is always released back to the pool.
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
