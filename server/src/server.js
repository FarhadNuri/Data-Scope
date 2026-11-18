import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

// Verify database connection on startup
try {
  await pool.query('SELECT 1');
  console.log('Database connected');
} catch (error) {
  const errorMessage = error.message || error.errors?.map((e) => e.message).join(', ') || error.code || 'Unknown error';
  console.error(`[DATABASE ERROR] Failed to connect to PostgreSQL: ${errorMessage}`);
  process.exit(1);
}

// Start HTTP server
app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
