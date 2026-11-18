import { query } from '../../db/pool.js';
import { calculateOffset } from '../../utils/pagination.js';
import { buildWhereClause, buildOrderByClause } from './query-builder.js';

// Filters JSONB data to retain only specified columns
// NOTE: Selecting JSON keys directly in SQL (e.g. jsonb_build_object) is a possible later optimization.
function filterColumns(data, columns) {
  if (!Array.isArray(columns) || columns.length === 0 || !data || typeof data !== 'object') {
    return data;
  }
  const picked = {};
  for (const col of columns) {
    if (Object.prototype.hasOwnProperty.call(data, col)) {
      picked[col] = data[col];
    }
  }
  return picked;
}

// Maps database row to standard API record shape
function toRecord(row, columns) {
  return {
    id: row.id,
    datasetId: row.dataset_id,
    data: filterColumns(row.data, columns),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Executes search queries against dataset_records
export async function findRecords(datasetId, request, fields, knownTotal) {
  const page = request.page || 1;
  const pageSize = request.pageSize || 25;
  const offset = calculateOffset(page, pageSize);

  // 1. Build page query with WHERE, ORDER BY, LIMIT, and OFFSET
  const pageParams = [];
  const whereSql = buildWhereClause(datasetId, request, fields, pageParams);
  const orderBySql = buildOrderByClause(request, fields, pageParams);

  pageParams.push(pageSize);
  const limitPlaceholder = `$${pageParams.length}`;
  pageParams.push(offset);
  const offsetPlaceholder = `$${pageParams.length}`;

  const pageSql = `SELECT id, dataset_id, data, created_at, updated_at FROM dataset_records ${whereSql} ${orderBySql} LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;

  // 2. Build count query if knownTotal is not provided
  let countPromise;
  if (knownTotal !== undefined && knownTotal !== null) {
    countPromise = Promise.resolve(Number(knownTotal));
  } else {
    const countParams = [];
    const countWhereSql = buildWhereClause(datasetId, request, fields, countParams);
    const countSql = `SELECT count(*) FROM dataset_records ${countWhereSql}`;
    countPromise = query(countSql, countParams).then((res) => parseInt(res.rows[0].count, 10));
  }

  // Run page query and count query in parallel with Promise.all
  // WHY: Running both queries concurrently allows PostgreSQL to execute them across available
  // pool connections simultaneously. This reduces overall response latency to max(pageQuery, countQuery)
  // rather than running them sequentially (pageQuery + countQuery).
  const [pageResult, totalItems] = await Promise.all([
    query(pageSql, pageParams),
    countPromise,
  ]);

  const rows = pageResult.rows.map((row) => toRecord(row, request.columns));
  return { rows, totalItems };
}
