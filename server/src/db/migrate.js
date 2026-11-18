import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Runs pending SQL migration files in numerical order inside database transactions
async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');

  try {
    // 1. Create schema_migrations tracking table if it does not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        run_at timestamptz DEFAULT now()
      );
    `);

    // 2. Fetch set of previously applied migrations
    const { rows } = await pool.query('SELECT name FROM schema_migrations');
    const executedMigrations = new Set(rows.map((row) => row.name));

    // 3. Read all .sql files in migrations directory, sorted alphabetically
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let ranCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      if (executedMigrations.has(file)) {
        console.log(`[SKIP] ${file} (already executed)`);
        skippedCount++;
        continue;
      }

      console.log(`[RUN] Applying ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      // Execute each migration file inside its own database transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sqlContent);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[DONE] Applied ${file}`);
        ranCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[FAILED] Error running migration ${file}:`, err.message);
        throw err;
      } finally {
        client.release();
      }
    }

    console.log(`\nMigrations finished: ${ranCount} ran, ${skippedCount} skipped.`);
  } catch (error) {
    const errorDetails = error.message || error.errors?.map((e) => e.message).join(', ') || error;
    console.error('\n[FATAL MIGRATION ERROR]', errorDetails);
    process.exit(1);
  } finally {
    // Ensure the connection pool is closed so the process can exit cleanly
    await pool.end();
  }
}

runMigrations();
