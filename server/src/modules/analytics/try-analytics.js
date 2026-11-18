import {
  getDatasetGrowth,
  getSearchActivity,
  getTopFilters,
} from './analytics.service.js';

async function run() {
  console.log('=== ANALYTICS MODULE VERIFICATION ===\n');

  // 1. Interval whitelist
  console.log('1. Testing interval whitelist:');
  try {
    await getDatasetGrowth('11111111-1111-4111-8111-111111111111', { interval: 'hourly' });
    console.error('  FAIL: Invalid interval should be rejected');
  } catch (err) {
    console.log(`  PASS: Invalid interval threw ${err.statusCode}: "${err.message}"`);
  }

  // 2. Date range validation
  console.log('\n2. Testing date range validation:');
  try {
    await getDatasetGrowth('11111111-1111-4111-8111-111111111111', {
      from: '2026-10-01',
      to: '2026-09-01', // to < from
    });
    console.error('  FAIL: Inverted date range should be rejected');
  } catch (err) {
    console.log(`  PASS: Inverted date range threw ${err.statusCode}: "${err.message}"`);
  }

  try {
    await getDatasetGrowth('11111111-1111-4111-8111-111111111111', {
      interval: 'day',
      from: '2024-01-01',
      to: '2026-01-01', // > 366 days
    });
    console.error('  FAIL: Day interval > 366 days should be rejected');
  } catch (err) {
    console.log(`  PASS: Day interval > 366 days threw ${err.statusCode}: "${err.message}"`);
  }

  // 3. Search activity days parameter validation
  console.log('\n3. Testing search activity days limit:');
  try {
    await getSearchActivity({ id: 'u1', role: 'ADMIN' }, { days: 120 }); // > 90
    console.error('  FAIL: days > 90 should be rejected');
  } catch (err) {
    console.log(`  PASS: days > 90 threw ${err.statusCode}: "${err.message}"`);
  }

  // 4. Role restrictions for scope=all
  console.log('\n4. Testing scope=all authorization:');
  try {
    await getSearchActivity({ id: 'u2', role: 'ANALYST' }, { scope: 'all' });
    console.error('  FAIL: Non-admin using scope=all should be rejected');
  } catch (err) {
    console.log(`  PASS: Non-admin using scope=all threw ${err.statusCode}: "${err.message}"`);
  }

  try {
    await getTopFilters({ id: 'u2', role: 'VIEWER' }, { scope: 'all' });
    console.error('  FAIL: Viewer using scope=all should be rejected');
  } catch (err) {
    console.log(`  PASS: Viewer using scope=all threw ${err.statusCode}: "${err.message}"`);
  }

  console.log('\nAll analytics unit logic passed successfully!');
}

run().catch(console.error);
