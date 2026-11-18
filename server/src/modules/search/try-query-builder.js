import { buildWhereClause, buildOrderByClause } from './query-builder.js';
import { normalizeRequest } from './normalize-request.js';
import { validateSearchRequest } from './search-validator.js';

// Schema fields definition matching Customers dataset
const fields = [
  { key: 'name', type: 'text', isFilterable: true, isSortable: true, isSearchable: true },
  { key: 'status', type: 'select', isFilterable: true, isSortable: true, isSearchable: false },
  { key: 'country', type: 'select', isFilterable: true, isSortable: true, isSearchable: false },
  { key: 'revenue', type: 'number', isFilterable: true, isSortable: true, isSearchable: false },
];

console.log('=== 1. STANDARD SEARCH FROM DOCS/02 D7 ===');
const exampleRequest = {
  search: 'acme',
  searchMode: 'fulltext',
  logic: 'AND',
  conditions: [
    { field: 'status', operator: 'eq', value: 'Active' },
    { field: 'country', operator: 'eq', value: 'Germany' },
    { field: 'revenue', operator: 'gt', value: 10000 },
    { field: 'created_at', operator: 'lastDays', value: 30 },
  ],
  sort: [{ field: 'revenue', direction: 'desc' }],
  page: 1,
  pageSize: 25,
};

const normalized = normalizeRequest(exampleRequest);
const params = [];
const datasetId = '11111111-1111-4111-8111-111111111111';

const whereSql = buildWhereClause(datasetId, normalized, fields, params);
const orderSql = buildOrderByClause(normalized, fields, params);

console.log('\n--- GENERATED WHERE CLAUSE ---');
console.log(whereSql);
console.log('\n--- GENERATED ORDER BY CLAUSE ---');
console.log(orderSql);
console.log('\n--- QUERY PARAMETERS ---');
params.forEach((param, index) => {
  console.log(`  $${index + 1}:`, typeof param === 'string' && param.startsWith('{') ? param : JSON.stringify(param));
});

console.log('\n=== 2. VALIDATOR ON INVALID REQUESTS ===');
const badRequest = {
  conditions: [
    { field: 'unknown_column', operator: 'eq', value: 'test' },
    { field: 'name', operator: 'gt', value: 500 },
  ],
};
const validationErrors = validateSearchRequest(badRequest, fields, 'ADMIN');
console.log('Validation errors detected:');
validationErrors.forEach((err) => {
  console.log(`  - [${err.path}] ${err.message}`);
});

console.log('\n=== 3. SQL INJECTION ATTEMPT PROOF ===');
const injectionRequest = {
  search: "'; DROP TABLE users; --",
  conditions: [
    { field: 'name', operator: 'contains', value: "'; DROP TABLE users; --" },
  ],
};
const injectionNormalized = normalizeRequest(injectionRequest);
const injectionParams = [];
const injectionWhere = buildWhereClause(datasetId, injectionNormalized, fields, injectionParams);

console.log('WHERE clause text:');
console.log(injectionWhere);
console.log('\nNotice: Contains ONLY $1, $2, $3, $4 placeholders. Never user text.');
console.log('\nParameters array holding the escaped payload:');
injectionParams.forEach((param, index) => {
  console.log(`  $${index + 1}:`, JSON.stringify(param));
});
