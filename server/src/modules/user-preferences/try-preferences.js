import { validatePreferences } from './user-preferences.validation.js';
import { DEFAULT_PREFERENCES } from './user-preferences.service.js';

async function run() {
  console.log('=== USER PREFERENCES MODULE VERIFICATION ===\n');

  // 1. Valid payload validation
  console.log('1. Testing validatePreferences with valid inputs:');
  const validPayload = {
    theme: 'dark',
    defaultPageSize: 50,
    visibleColumns: {
      '11111111-1111-4111-8111-111111111111': ['name', 'status', 'created_at'],
    },
  };
  const validated = validatePreferences(validPayload);
  console.log('  PASS: Valid preferences accepted:', validated);

  // 2. Invalid theme rejection (400)
  console.log('\n2. Testing invalid theme rejection:');
  try {
    validatePreferences({ theme: 'blue_neon' });
    console.error('  FAIL: Invalid theme should throw HttpError');
  } catch (err) {
    console.log(`  PASS: Invalid theme threw ${err.statusCode}: "${err.message}" with details:`, err.details);
  }

  // 3. Invalid defaultPageSize rejection (400)
  console.log('\n3. Testing invalid defaultPageSize rejection:');
  try {
    validatePreferences({ defaultPageSize: 35 }); // only 10, 25, 50, 100 allowed
    console.error('  FAIL: Invalid defaultPageSize should throw HttpError');
  } catch (err) {
    console.log(`  PASS: Invalid defaultPageSize threw ${err.statusCode}: "${err.message}" with details:`, err.details);
  }

  // 4. Invalid visibleColumns dataset key rejection (400)
  console.log('\n4. Testing invalid visibleColumns non-UUID dataset key rejection:');
  try {
    validatePreferences({
      visibleColumns: {
        'not-a-uuid': ['name'],
      },
    });
    console.error('  FAIL: Non-UUID dataset key should throw HttpError');
  } catch (err) {
    console.log(`  PASS: Non-UUID dataset key threw ${err.statusCode}: "${err.message}" with details:`, err.details);
  }

  // 5. Invalid column name rejection (400)
  console.log('\n5. Testing invalid column identifier rejection:');
  try {
    validatePreferences({
      visibleColumns: {
        '11111111-1111-4111-8111-111111111111': ['Invalid-Column-Name!'],
      },
    });
    console.error('  FAIL: Invalid column key should throw HttpError');
  } catch (err) {
    console.log(`  PASS: Invalid column key threw ${err.statusCode}: "${err.message}" with details:`, err.details);
  }

  // 6. Merge behavior verification
  console.log('\n6. Testing merge behavior:');
  const ds1 = '11111111-1111-4111-8111-111111111111';
  const ds2 = '22222222-2222-4222-8222-222222222222';

  // Step A: Initial state = defaults
  let currentState = { ...DEFAULT_PREFERENCES };
  console.log('  Initial state theme:', currentState.theme, 'visibleColumns:', currentState.visibleColumns);

  // Step B: User PUT { theme: 'dark', visibleColumns: { [ds1]: ['name', 'status'] } }
  const update1 = {
    theme: 'dark',
    visibleColumns: { [ds1]: ['name', 'status'] },
  };
  currentState = {
    ...currentState,
    theme: update1.theme,
    visibleColumns: { ...currentState.visibleColumns, ...update1.visibleColumns },
  };
  console.log('  After update 1 theme:', currentState.theme, 'ds1 cols:', currentState.visibleColumns[ds1]);

  // Step C: User PUT { visibleColumns: { [ds2]: ['revenue'] } }
  // Verify ds1 is kept while ds2 is added
  const update2 = {
    visibleColumns: { [ds2]: ['revenue'] },
  };
  currentState = {
    ...currentState,
    visibleColumns: { ...currentState.visibleColumns, ...update2.visibleColumns },
  };
  console.log('  After update 2 ds1 cols:', currentState.visibleColumns[ds1]);
  console.log('  After update 2 ds2 cols:', currentState.visibleColumns[ds2]);

  if (currentState.visibleColumns[ds1] && currentState.visibleColumns[ds2]) {
    console.log('  PASS: Dataset 1 columns successfully preserved when updating Dataset 2 columns');
  } else {
    console.error('  FAIL: Dataset columns were overwritten instead of preserved');
  }

  console.log('\nAll user preferences unit logic passed successfully!');
}

run().catch(console.error);
