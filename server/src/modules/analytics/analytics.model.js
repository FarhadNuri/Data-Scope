import { query } from '../../db/pool.js';

// Platform-wide counts aggregation query
export async function countsOverview() {
  const sql = `
    SELECT
      (SELECT count(*) FROM datasets)::integer AS total_datasets,
      (SELECT COALESCE(sum(total_records), 0) FROM datasets)::integer AS total_records,
      (SELECT count(*) FROM users)::integer AS total_users,
      (SELECT count(*) FROM search_history WHERE created_at >= now() - interval '7 days')::integer AS searches_last_7_days
  `;
  const result = await query(sql);
  const row = result.rows[0];
  return {
    totalDatasets: parseInt(row.total_datasets, 10),
    totalRecords: parseInt(row.total_records, 10),
    totalUsers: parseInt(row.total_users, 10),
    searchesLast7Days: parseInt(row.searches_last_7_days, 10),
  };
}

// Dataset record total and field-level category/status distributions
export async function datasetSummary(datasetId, categoryKey = null, statusKey = null) {
  const totalSql = `SELECT total_records FROM datasets WHERE id = $1`;
  const totalRes = await query(totalSql, [datasetId]);
  const totalRecords = totalRes.rows[0] ? parseInt(totalRes.rows[0].total_records, 10) : 0;

  let byCategory = [];
  if (categoryKey) {
    const catSql = `
      SELECT COALESCE(data->>$2, 'Unknown') AS label, count(*)::integer AS count
      FROM dataset_records
      WHERE dataset_id = $1
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 20
    `;
    const catRes = await query(catSql, [datasetId, categoryKey]);
    byCategory = catRes.rows.map((r) => ({ label: r.label, count: parseInt(r.count, 10) }));
  }

  let byStatus = [];
  if (statusKey) {
    const statusSql = `
      SELECT COALESCE(data->>$2, 'Unknown') AS label, count(*)::integer AS count
      FROM dataset_records
      WHERE dataset_id = $1
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 20
    `;
    const statusRes = await query(statusSql, [datasetId, statusKey]);
    byStatus = statusRes.rows.map((r) => ({ label: r.label, count: parseInt(r.count, 10) }));
  }

  return {
    totalRecords,
    byCategory,
    byStatus,
  };
}

// Aggregates records created over time bucketed by interval
export async function growth(datasetId, intervalSql, fromDate, toDate) {
  // intervalSql comes exclusively from a fixed whitelist (day, week, month)
  const sql = `
    SELECT
      to_char(date_trunc('${intervalSql}', created_at), 'YYYY-MM-DD') AS period,
      count(*)::integer AS count
    FROM dataset_records
    WHERE dataset_id = $1
      AND created_at >= $2
      AND created_at <= $3
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  const result = await query(sql, [datasetId, fromDate, toDate]);
  return result.rows.map((r) => ({ period: r.period, count: parseInt(r.count, 10) }));
}

// Aggregates search history count and average duration by day
export async function searchActivity(userId = null, days = 30) {
  const sql = `
    SELECT
      to_char(created_at::date, 'YYYY-MM-DD') AS date,
      count(*)::integer AS searches,
      round(avg(took_ms))::integer AS "avgTookMs"
    FROM search_history
    WHERE created_at >= now() - ($1::integer * interval '1 day')
      AND ($2::uuid IS NULL OR user_id = $2)
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  const result = await query(sql, [days, userId]);
  return result.rows.map((r) => ({
    date: r.date,
    searches: parseInt(r.searches, 10),
    avgTookMs: parseInt(r.avgTookMs || 0, 10),
  }));
}

// Aggregates the most frequently used search filter conditions from search history
// HOW IT WORKS STEP BY STEP:
// 1. jsonb_array_elements(sh.config->'conditions') flattens each search query's JSONB conditions array
//    into individual JSON condition elements across all matching history rows.
// 2. The CTE extracts the 'field' and 'operator' string properties from each unnested condition object.
// 3. Filters to the requested user and/or dataset scope.
// 4. Groups by field + operator, aggregates count(*)::integer AS usedCount, and orders descending by frequency.
export async function topFilters(userId = null, datasetId = null, limit = 10) {
  const sql = `
    WITH conditions AS (
      SELECT
        elem->>'field' AS field,
        elem->>'operator' AS operator
      FROM search_history sh,
      jsonb_array_elements(sh.config->'conditions') AS elem
      WHERE ($1::uuid IS NULL OR sh.user_id = $1)
        AND ($2::uuid IS NULL OR sh.dataset_id = $2)
    )
    SELECT
      field,
      operator,
      count(*)::integer AS "usedCount"
    FROM conditions
    WHERE field IS NOT NULL AND operator IS NOT NULL
    GROUP BY field, operator
    ORDER BY "usedCount" DESC
    LIMIT $3
  `;
  const result = await query(sql, [userId, datasetId, limit]);
  return result.rows.map((r) => ({
    field: r.field,
    operator: r.operator,
    usedCount: parseInt(r.usedCount, 10),
  }));
}
