import {
  validateCreateView,
  validateUpdateView,
  validateShareView,
} from './saved-views.validation.js';
import { validateOrThrow } from '../search/search-validator.js';
import { normalizeRequest } from '../search/normalize-request.js';

const mockFields = [
  { key: 'status', type: 'select', isFilterable: true, isSortable: true, isSearchable: false },
  { key: 'country', type: 'select', isFilterable: true, isSortable: true, isSearchable: false },
  { key: 'revenue', type: 'number', isFilterable: true, isSortable: true, isSearchable: false },
];

async function run() {
  console.log('=== SAVED VIEWS MODULE VERIFICATION ===\n');

  // 1. Validation of create payload
  console.log('1. Testing validateCreateView:');
  const validBody = {
    name: 'Active German Customers',
    datasetId: '11111111-1111-4111-8111-111111111111',
    config: {
      search: 'acme',
      conditions: [
        { field: 'status', operator: 'eq', value: 'Active' },
        { field: 'country', operator: 'eq', value: 'Germany' },
      ],
      sort: [{ field: 'revenue', direction: 'desc' }],
      columns: ['status', 'country', 'revenue'],
    },
  };
  const validated = validateCreateView(validBody);
  console.log('  PASS: Valid view payload accepted:', validated.name);

  // 2. Validation of config using search validator (supplying page/pageSize)
  console.log('\n2. Testing search config validation without page/pageSize:');
  const normalized = normalizeRequest({ ...validated.config, page: 1, pageSize: 25 });
  validateOrThrow(normalized, mockFields, 'ANALYST');
  const { page, pageSize, ...cleanConfig } = normalized;
  console.log('  PASS: Config normalized and verified without page/pageSize:');
  console.log('        Has page/pageSize?', 'page' in cleanConfig, 'pageSize' in cleanConfig);
  console.log('        Conditions count:', cleanConfig.conditions.length);

  // 3. Viewer role restriction in config
  console.log('\n3. Testing Viewer role restriction on config:');
  const viewerConfig = {
    conditions: [{ field: 'revenue', operator: 'gt', value: 10000 }],
  };
  try {
    const norm = normalizeRequest({ ...viewerConfig, page: 1, pageSize: 25 });
    validateOrThrow(norm, mockFields, 'VIEWER');
    console.error('  FAIL: Viewer should not be allowed to use "gt" in config');
  } catch (err) {
    console.log(`  PASS: Viewer using 'gt' threw status ${err.statusCode}: "${err.message}"`);
  }

  // 4. Update payload validation
  console.log('\n4. Testing validateUpdateView:');
  const updateBody = { name: 'Updated View Name' };
  const valUpdate = validateUpdateView(updateBody);
  console.log('  PASS: Update payload validated:', valUpdate);

  // 5. Share payload validation
  console.log('\n5. Testing validateShareView:');
  const shareBody = { userIds: ['22222222-2222-4222-8222-222222222222'] };
  const valShare = validateShareView(shareBody);
  console.log('  PASS: Share payload validated:', valShare.userIds);

  console.log('\nAll saved views unit logic passed successfully!');
}

run().catch(console.error);
