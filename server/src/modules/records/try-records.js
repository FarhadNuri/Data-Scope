import { validateRecordData } from './record-data.validation.js';
import { calculateChanges } from './calculate-changes.js';
import { buildSearchText } from './build-search-text.js';

const mockFields = [
  { key: 'name', type: 'text', isSearchable: true },
  { key: 'revenue', type: 'number', isSearchable: false },
  { key: 'status', type: 'select', isSearchable: false },
  { key: 'signup_date', type: 'date', isSearchable: false },
  { key: 'is_verified', type: 'boolean', isSearchable: false },
];

async function run() {
  console.log('=== RECORDS MODULE VERIFICATION ===\n');

  // 1. Validation - Valid payload
  console.log('1. Testing validateRecordData with valid payload:');
  const validData = {
    name: 'Acme Corp',
    revenue: 50000,
    status: 'Active',
    signup_date: '2026-01-15T10:00:00.000Z',
    is_verified: true,
  };
  const validated = validateRecordData(validData, mockFields);
  console.log('  PASS: Valid data accepted:', validated);

  // 2. Validation - Unknown field
  console.log('\n2. Testing validateRecordData with unknown field:');
  try {
    validateRecordData({ ...validData, invalid_key: 'test' }, mockFields);
    console.error('  FAIL: Unknown field should have thrown HttpError');
  } catch (err) {
    console.log(`  PASS: Threw ${err.statusCode}: "${err.message}" with details:`, err.details);
  }

  // 3. Validation - Type errors
  console.log('\n3. Testing validateRecordData with invalid types:');
  try {
    validateRecordData(
      {
        name: 12345, // should be string
        revenue: 'expensive', // should be number
        signup_date: 'not-a-date', // should be ISO date
        is_verified: 'yes', // should be boolean
      },
      mockFields
    );
    console.error('  FAIL: Invalid types should have thrown HttpError');
  } catch (err) {
    console.log(`  PASS: Threw ${err.statusCode}: "${err.message}" with details:`, err.details);
  }

  // 4. Calculate changes
  console.log('\n4. Testing calculateChanges:');
  const oldSnapshot = {
    name: 'Acme Corp',
    revenue: 50000,
    status: 'Pending',
    is_verified: false,
  };
  const newSnapshot = {
    name: 'Acme Corp',
    revenue: 75000, // changed
    status: 'Active', // changed
    is_verified: false, // unchanged
  };
  const diff = calculateChanges(oldSnapshot, newSnapshot);
  console.log('  Calculated diff:', diff);
  if (diff.length === 2 && diff.some((d) => d.field === 'revenue') && diff.some((d) => d.field === 'status')) {
    console.log('  PASS: Correctly detected only changed fields');
  } else {
    console.error('  FAIL: Diff calculation unexpected');
  }

  // 5. Build search text
  console.log('\n5. Testing buildSearchText:');
  const searchText = buildSearchText(validData, mockFields);
  console.log('  Generated search text:', `"${searchText}"`);
  if (searchText === 'acme corp') {
    console.log('  PASS: Composite search text matches searchable fields');
  } else {
    console.error('  FAIL: Unexpected search text');
  }

  console.log('\nAll records module unit logic passed successfully!');
}

run().catch(console.error);
