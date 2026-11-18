import { escapeLike } from '../../utils/escape-like.js';
import { SYSTEM_FIELDS } from './search.constants.js';

/**
 * ============================================================================
 * QUERY BUILDER OPERATOR MAPPING REFERENCE
 * ============================================================================
 *
 * FIELD TYPE | OPERATOR    | SQL GENERATED                            | INDEX USED
 * -----------+-------------+------------------------------------------+-----------------------
 * text/select| eq          | data @> $n::jsonb                        | GIN (jsonb_path_ops)
 * text/select| neq         | NOT (data @> $n::jsonb)                  | -
 * text       | contains    | data ->> $k ILIKE $v (%val%)             | GIN (search_text trgm)
 * text       | startsWith  | data ->> $k ILIKE $v (val%)              | B-tree / trgm
 * select     | in          | (data @> $a::jsonb OR data @> $b::jsonb) | GIN (jsonb_path_ops)
 * number     | eq          | data @> $n::jsonb                        | GIN (jsonb_path_ops)
 * number     | gt/gte/lt/le| (data ->> $k)::numeric <op> $v::numeric  | Partial expression
 * number     | between     | (data ->> $k)::numeric >= $a AND <= $b   | Partial expression
 * date       | eq          | (data ->> $k)::timestamptz::date = $v    | Partial expression
 * date       | before/after| (data ->> $k)::timestamptz <op> $v       | Partial expression
 * date       | between     | (data ->> $k)::timestamptz >= $a AND <=$b| Partial expression
 * date       | lastDays    | (data ->> $k)::timestamptz >= now() - $d | Partial expression
 * boolean    | eq          | data @> $n::jsonb                        | GIN (jsonb_path_ops)
 * any        | isEmpty     | (data ->> $k IS NULL OR data ->> $k = '')| -
 * any        | isNotEmpty  | (data ->> $k IS NOT NULL AND ... <> '')  | -
 * SystemDate | all date ops| uses real column: created_at / updated_at| B-tree composite
 * ============================================================================
 */

// Helper to push a value into parameters array and return its $n placeholder
function addParam(params, value) {
  params.push(value);
  return `$${params.length}`;
}

// Whitelisted symbols and directions to guarantee SQL syntax safety
const NUMERIC_OPERATORS = { gt: '>', gte: '>=', lt: '<', lte: '<=' };
const DIRECTION_MAP = { asc: 'ASC', desc: 'DESC' };

// Builds the complete WHERE SQL clause and appends parameter values
export function buildWhereClause(datasetId, request, fields, params) {
  // Always begin with dataset scoping as the very first parameter ($1)
  const whereClauses = [`dataset_id = ${addParam(params, datasetId)}`];

  // 1. Global search (always joined with AND)
  if (request.search && typeof request.search === 'string' && request.search.trim().length > 0) {
    const trimmed = request.search.trim();
    if (request.searchMode === 'partial') {
      const p = addParam(params, `%${escapeLike(trimmed)}%`);
      whereClauses.push(`search_text ILIKE ${p}`);
    } else {
      const p = addParam(params, trimmed);
      whereClauses.push(`search_vector @@ websearch_to_tsquery('simple', ${p})`);
    }
  }

  // 2. Structured conditions
  if (Array.isArray(request.conditions) && request.conditions.length > 0) {
    const fieldMap = new Map();
    Object.values(SYSTEM_FIELDS).forEach((f) => fieldMap.set(f.key, f));
    if (Array.isArray(fields)) fields.forEach((f) => fieldMap.set(f.key, f));

    const conditionClauses = [];

    for (const c of request.conditions) {
      const fieldDef = fieldMap.get(c.field);
      if (!fieldDef) continue;

      const isSystemField = Boolean(SYSTEM_FIELDS[c.field]);
      const clause = isSystemField
        ? buildSystemFieldCondition(c.field, c.operator, c.value, params)
        : buildJsonbFieldCondition(c.field, fieldDef.type, c.operator, c.value, params);

      if (clause) conditionClauses.push(clause);
    }

    if (conditionClauses.length > 0) {
      const glue = request.logic === 'OR' ? ' OR ' : ' AND ';
      whereClauses.push(`(${conditionClauses.join(glue)})`);
    }
  }

  return `WHERE ${whereClauses.join(' AND ')}`;
}

// Builds condition clause for real system date columns (created_at, updated_at)
function buildSystemFieldCondition(col, operator, value, params) {
  switch (operator) {
    case 'eq':
      return `${col}::date = ${addParam(params, value)}::date`;
    case 'before':
      return `${col} < ${addParam(params, value)}::timestamptz`;
    case 'after':
      return `${col} > ${addParam(params, value)}::timestamptz`;
    case 'between': {
      const p1 = addParam(params, value[0]);
      const p2 = addParam(params, value[1]);
      return `(${col} >= ${p1}::timestamptz AND ${col} <= ${p2}::timestamptz)`;
    }
    case 'lastDays':
      return `${col} >= now() - (${addParam(params, value)}::integer * interval '1 day')`;
    case 'isEmpty':
      return `${col} IS NULL`;
    case 'isNotEmpty':
      return `${col} IS NOT NULL`;
    default:
      return null;
  }
}

// Builds condition clause for dynamic fields stored inside records.data JSONB.
// NOTE ON EXPRESSION INDEX MATCHING (docs/04 prompt 11/12):
// In PostgreSQL, expression indexes like ((data->>'revenue')::numeric) only match
// when the field key is a literal string ('revenue') in the query expression tree.
// If the key were passed as a parameter $k, PostgreSQL treats it as an unknown variable
// during planning and cannot use the partial expression index.
// Every key here has been validated against /^[a-z][a-z0-9_]{0,49}$/ and whitelisted
// against dataset_fields, making embedding '${key}' completely injection-safe.
function buildJsonbFieldCondition(key, type, operator, value, params) {
  if (!/^[a-z][a-z0-9_]{0,49}$/.test(key)) {
    throw new Error(`Invalid field key syntax: ${key}`);
  }
  const fieldKeyLiteral = `'${key}'`;

  if (operator === 'isEmpty') {
    return `(data ->> ${fieldKeyLiteral} IS NULL OR data ->> ${fieldKeyLiteral} = '')`;
  }
  if (operator === 'isNotEmpty') {
    return `(data ->> ${fieldKeyLiteral} IS NOT NULL AND data ->> ${fieldKeyLiteral} <> '')`;
  }

  // GIN index equality operations: data @> $jsonb
  if (operator === 'eq' && (type === 'text' || type === 'select' || type === 'boolean' || type === 'number')) {
    const p = addParam(params, JSON.stringify({ [key]: value }));
    return `data @> ${p}::jsonb`;
  }

  if (operator === 'neq') {
    const p = addParam(params, JSON.stringify({ [key]: value }));
    return `NOT (data @> ${p}::jsonb)`;
  }

  if (operator === 'in' && Array.isArray(value)) {
    const orParts = value.map((val) => {
      const p = addParam(params, JSON.stringify({ [key]: val }));
      return `data @> ${p}::jsonb`;
    });
    return orParts.length > 0 ? `(${orParts.join(' OR ')})` : null;
  }

  // Numeric comparisons (utilizes partial expression index ((data->>'key')::numeric))
  if (type === 'number') {
    const op = NUMERIC_OPERATORS[operator];
    if (op) {
      return `((data ->> ${fieldKeyLiteral})::numeric ${op} ${addParam(params, value)}::numeric)`;
    }
    if (operator === 'between' && Array.isArray(value)) {
      const p1 = addParam(params, value[0]);
      const p2 = addParam(params, value[1]);
      return `((data ->> ${fieldKeyLiteral})::numeric >= ${p1}::numeric AND (data ->> ${fieldKeyLiteral})::numeric <= ${p2}::numeric)`;
    }
  }

  // Text partial matching
  if (operator === 'contains') {
    return `data ->> ${fieldKeyLiteral} ILIKE ${addParam(params, `%${escapeLike(value)}%`)}`;
  }
  if (operator === 'startsWith') {
    return `data ->> ${fieldKeyLiteral} ILIKE ${addParam(params, `${escapeLike(value)}%`)}`;
  }

  // Date comparisons on JSONB (utilizes partial expression index ((data->>'key')::timestamptz))
  if (type === 'date') {
    switch (operator) {
      case 'eq':
        return `(data ->> ${fieldKeyLiteral})::timestamptz::date = ${addParam(params, value)}::date`;
      case 'before':
        return `(data ->> ${fieldKeyLiteral})::timestamptz < ${addParam(params, value)}::timestamptz`;
      case 'after':
        return `(data ->> ${fieldKeyLiteral})::timestamptz > ${addParam(params, value)}::timestamptz`;
      case 'between': {
        const p1 = addParam(params, value[0]);
        const p2 = addParam(params, value[1]);
        return `((data ->> ${fieldKeyLiteral})::timestamptz >= ${p1}::timestamptz AND (data ->> ${fieldKeyLiteral})::timestamptz <= ${p2}::timestamptz)`;
      }
      case 'lastDays':
        return `(data ->> ${fieldKeyLiteral})::timestamptz >= now() - (${addParam(params, value)}::integer * interval '1 day')`;
    }
  }

  return null;
}

// Builds the ORDER BY clause with tie-breaking for deterministic pagination
export function buildOrderByClause(request, fields, params) {
  const sortClauses = [];

  if (Array.isArray(request.sort) && request.sort.length > 0) {
    const fieldMap = new Map();
    Object.values(SYSTEM_FIELDS).forEach((f) => fieldMap.set(f.key, f));
    if (Array.isArray(fields)) fields.forEach((f) => fieldMap.set(f.key, f));

    for (const s of request.sort) {
      const fieldDef = fieldMap.get(s.field);
      if (!fieldDef) continue;

      const dir = DIRECTION_MAP[s.direction] || 'ASC';

      if (SYSTEM_FIELDS[s.field]) {
        sortClauses.push(`${s.field} ${dir} NULLS LAST`);
      } else {
        if (!/^[a-z][a-z0-9_]{0,49}$/.test(s.field)) {
          throw new Error(`Invalid sort field syntax: ${s.field}`);
        }
        const fieldKeyLiteral = `'${s.field}'`;
        if (fieldDef.type === 'number') {
          sortClauses.push(`((data ->> ${fieldKeyLiteral})::numeric) ${dir} NULLS LAST`);
        } else if (fieldDef.type === 'date') {
          sortClauses.push(`((data ->> ${fieldKeyLiteral})::timestamptz) ${dir} NULLS LAST`);
        } else {
          sortClauses.push(`(data ->> ${fieldKeyLiteral}) ${dir} NULLS LAST`);
        }
      }
    }
  }

  // When no explicit sort is requested:
  if (sortClauses.length === 0) {
    // If fulltext search is present, sort by relevance rank first
    if (request.search && request.search.trim().length > 0 && request.searchMode !== 'partial') {
      const p = addParam(params, request.search.trim());
      sortClauses.push(`ts_rank(search_vector, websearch_to_tsquery('simple', ${p})) DESC`);
    }
    sortClauses.push('created_at DESC');
  }

  // UNIQUE TIE-BREAKER: We ALWAYS append `id ASC` as the final sort criterion.
  // WHY: Without a unique column in the ORDER BY clause, PostgreSQL does not guarantee
  // deterministic ordering across pagination requests. Rows sharing equal timestamps or values
  // could shift positions, resulting in duplicate or skipped records between page jumps.
  sortClauses.push('id ASC');

  return `ORDER BY ${sortClauses.join(', ')}`;
}
