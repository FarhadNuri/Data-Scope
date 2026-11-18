import { query } from '../pool.js';
import { isUuid } from '../../utils/validate.js';

// Creates partial expression indexes tailored for the Customers dataset
export async function createCustomerIndexes(datasetId) {
  // DDL statements (like CREATE INDEX) cannot use parameterized placeholders ($1)
  // in WHERE clauses or index expressions in PostgreSQL.
  // We strictly validate that datasetId is a valid UUID before interpolating it
  // into the SQL string to completely eliminate any SQL injection risk.
  if (!isUuid(datasetId)) {
    throw new Error(`Invalid datasetId "${datasetId}" provided for index creation.`);
  }

  console.log(`\nCreating hot-field expression indexes for Customers (${datasetId})...`);

  // Ensure pg_trgm extension is active for trigram index
  await query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

  // WHY PARTIAL INDEXES:
  // Expression indexes with explicit type casts (such as ::numeric on revenue or
  // ::timestamptz on signup_date) MUST be partial indexes filtered by "WHERE dataset_id = '<id>'".
  // Because all datasets share the single `dataset_records` table, if another dataset stores
  // non-numeric strings or different data under 'revenue' or 'signup_date', an unconstrained
  // index would attempt to cast those values and throw cast exception errors, breaking inserts
  // and updates on other datasets. Partial indexing guarantees that casts only evaluate on this dataset's rows.
  const indexes = [
    {
      name: 'idx_customers_status',
      sql: `CREATE INDEX IF NOT EXISTS idx_customers_status
            ON dataset_records (((data->>'status')))
            WHERE dataset_id = '${datasetId}';`,
    },
    {
      name: 'idx_customers_country',
      sql: `CREATE INDEX IF NOT EXISTS idx_customers_country
            ON dataset_records (((data->>'country')))
            WHERE dataset_id = '${datasetId}';`,
    },
    {
      name: 'idx_customers_revenue',
      sql: `CREATE INDEX IF NOT EXISTS idx_customers_revenue
            ON dataset_records ((((data->>'revenue')::numeric)))
            WHERE dataset_id = '${datasetId}';`,
    },
    {
      name: 'idx_customers_signup_date',
      // Note: text::timestamptz is STABLE (timezone-dependent), which PostgreSQL disallows in index expressions.
      // Indexing (data->>'signup_date') as text is IMMUTABLE and sorts chronologically for ISO-8601 dates.
      sql: `CREATE INDEX IF NOT EXISTS idx_customers_signup_date
            ON dataset_records (((data->>'signup_date')))
            WHERE dataset_id = '${datasetId}';`,
    },
    {
      name: 'idx_customers_name_trgm',
      sql: `CREATE INDEX IF NOT EXISTS idx_customers_name_trgm
            ON dataset_records USING GIN (((data->>'name')) gin_trgm_ops)
            WHERE dataset_id = '${datasetId}';`,
    },
  ];

  for (const idx of indexes) {
    await query(idx.sql);
    console.log(`[INDEX CREATED] ${idx.name}`);
  }
}
