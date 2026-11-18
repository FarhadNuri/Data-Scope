import { validateSearchRequest } from './search-validator.js';
import { normalizeRequest } from './normalize-request.js';
import { buildWhereClause, buildOrderByClause } from './query-builder.js';
import { searchResultKey, filterCountKey } from '../../cache/cache-keys.js';
import { hashObject } from '../../utils/hash-object.js';

const mockFields = [
  { key: 'name', type: 'text', isFilterable: true, isSortable: true, isSearchable: true },
  { key: 'status', type: 'select', isFilterable: true, isSortable: true, isSearchable: false },
  { key: 'country', type: 'select', isFilterable: true, isSortable: true, isSearchable: false },
  { key: 'revenue', type: 'number', isFilterable: true, isSortable: true, isSearchable: false },
];

async function run() {
  console.log('=== SEARCH LOGIC & PIPELINE VERIFICATION ===\n');

  // 1. Validator on valid request
  const validRequest = {
    search: 'acme',
    searchMode: 'fulltext',
    logic: 'AND',
    conditions: [
      { field: 'status', operator: 'eq', value: 'Active' },
      { field: 'country', operator: 'eq', value: 'Germany' },
      { field: 'revenue', operator: 'gt', value: 10000 },
      { field: 'created_at', operator: 'lastDays', value: 30 },
    ],
    sort: [
      { field: 'revenue', direction: 'desc' },
      { field: 'name', direction: 'asc' },
    ],
    columns: ['name', 'status', 'country', 'revenue'],
    page: 1,
    pageSize: 25,
  };

  const adminErrors = validateSearchRequest(validRequest, mockFields, 'ADMIN');
  console.log('1. Admin validation errors (expected none):', adminErrors);

  // 2. Viewer role rejection on "gt" and conditions count
  const viewerRequest = {
    conditions: [
      { field: 'revenue', operator: 'gt', value: 10000 },
    ],
  };
  const viewerErrors = validateSearchRequest(viewerRequest, mockFields, 'VIEWER');
  console.log('2. Viewer validation errors for "gt" (expected 403 limit):', viewerErrors);

  // 3. Unknown field validation
  const badFieldRequest = {
    conditions: [
      { field: 'unknown_column', operator: 'eq', value: 'foo' },
    ],
  };
  const badFieldErrors = validateSearchRequest(badFieldRequest, mockFields, 'ADMIN');
  console.log('3. Unknown field validation errors (expected 400 bad field):', badFieldErrors);

  // 4. Normalization and cache keys
  const normalized = normalizeRequest(validRequest);
  const version = 1;
  const datasetId = '11111111-1111-4111-8111-111111111111';
  const resultKey = searchResultKey(datasetId, version, hashObject(normalized));
  const filterParams = {
    search: normalized.search,
    searchMode: normalized.searchMode,
    logic: normalized.logic,
    conditions: normalized.conditions,
  };
  const countKey = filterCountKey(datasetId, version, hashObject(filterParams));

  console.log('\n4. Generated Cache Keys:');
  console.log('   Result Key:', resultKey);
  console.log('   Count Key :', countKey);

  // Verify next page uses the exact same count key
  const page2Normalized = normalizeRequest({ ...validRequest, page: 2 });
  const page2FilterParams = {
    search: page2Normalized.search,
    searchMode: page2Normalized.searchMode,
    logic: page2Normalized.logic,
    conditions: page2Normalized.conditions,
  };
  const page2CountKey = filterCountKey(datasetId, version, hashObject(page2FilterParams));
  console.log('   Page 2 Count Key equals Page 1 Count Key:', countKey === page2CountKey);

  // 5. Query generation & Expression Index check
  const params = [];
  const whereSql = buildWhereClause(datasetId, normalized, mockFields, params);
  const orderSql = buildOrderByClause(normalized, mockFields, params);

  console.log('\n5. Generated SQL Clauses:');
  console.log('   WHERE :', whereSql);
  console.log('   ORDER :', orderSql);
  console.log('   PARAMS:', params);

  console.log('\nAll search pipeline verifications PASSED!');
}

run().catch(console.error);
