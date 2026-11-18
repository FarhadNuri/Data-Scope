import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { faker } from '@faker-js/faker';
import { pool, query, withTransaction } from '../pool.js';
import { seedUsers } from './seed-users.js';
import { createCustomerIndexes } from './create-indexes.js';
import { buildSearchText } from '../../modules/records/build-search-text.js';
import { recalculateTotalRecords } from '../../modules/datasets/datasets.model.js';

// Parses CLI args for --count=N
function parseTargetCount() {
  const countArg = process.argv.find((arg) => arg.startsWith('--count='));
  if (countArg) {
    const parsed = parseInt(countArg.split('=')[1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 100000;
}

// Pre-defined weighted distribution of 25 countries (includes Germany and Bangladesh)
const COUNTRIES = [
  'United States', 'Germany', 'United Kingdom', 'Bangladesh', 'France',
  'Canada', 'Australia', 'India', 'Japan', 'Brazil',
  'Netherlands', 'Singapore', 'Spain', 'Italy', 'Sweden',
  'Switzerland', 'South Korea', 'Mexico', 'United Arab Emirates', 'Poland',
  'Norway', 'Denmark', 'Ireland', 'Austria', 'New Zealand'
];

const CATEGORIES = ['Enterprise', 'SMB', 'Startup', 'Government', 'Nonprofit'];
const TICKET_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

// Generates status based on specification: 60% Active, 20% Inactive, 15% Pending, 5% Suspended
function generateStatus() {
  const r = faker.number.float({ min: 0, max: 1 });
  if (r < 0.60) return 'Active';
  if (r < 0.80) return 'Inactive';
  if (r < 0.95) return 'Pending';
  return 'Suspended';
}

// Generates skewed revenue: most under 20,000, a few above 500,000
function generateRevenue() {
  const r = faker.number.float({ min: 0, max: 1 });
  if (r < 0.75) {
    return faker.number.int({ min: 500, max: 20000 });
  }
  if (r < 0.95) {
    return faker.number.int({ min: 20001, max: 100000 });
  }
  return faker.number.int({ min: 100001, max: 750000 });
}

// Generates created_at timestamp spread over last 24 months with a slight upward trend
function generateCreatedAt(maxDays = 730) {
  // Power curve (exponent < 1.0) biases dates towards more recent timestamps
  const progress = Math.pow(faker.number.float({ min: 0, max: 1 }), 0.7);
  const daysAgo = Math.floor((1 - progress) * maxDays);
  const msAgo = daysAgo * 86400000 + faker.number.int({ min: 0, max: 86399000 });
  const createdAt = new Date(Date.now() - msAgo);
  const remainingMs = Date.now() - createdAt.getTime();
  const updatedAt = new Date(createdAt.getTime() + faker.number.int({ min: 0, max: Math.max(0, remainingMs) }));
  return { createdAt, updatedAt };
}

// Inserts records in a single multi-row parameterized query
async function insertRecordsBatch(client, datasetId, rows) {
  const valueClauses = [];
  const params = [];

  rows.forEach((row, rowIndex) => {
    const base = rowIndex * 6;
    valueClauses.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
    );
    params.push(
      row.id,
      datasetId,
      JSON.stringify(row.data),
      row.searchText,
      row.createdAt,
      row.updatedAt
    );
  });

  const sql = `
    INSERT INTO dataset_records (id, dataset_id, data, search_text, created_at, updated_at)
    VALUES ${valueClauses.join(', ')}
  `;

  await client.query(sql, params);
}

// Ensures dataset exists and returns its record
async function getOrCreateDataset(name, description, category, dataSource, adminId) {
  const res = await query('SELECT * FROM datasets WHERE name = $1', [name]);
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  const created = await query(
    `INSERT INTO datasets (name, description, category, data_source, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description, category, dataSource, adminId]
  );
  return created.rows[0];
}

// Ensures dataset fields exist
async function ensureFields(datasetId, fieldsDefinition) {
  for (let i = 0; i < fieldsDefinition.length; i++) {
    const f = fieldsDefinition[i];
    await query(
      `INSERT INTO dataset_fields (
        dataset_id, key, label, type, is_filterable, is_sortable, is_searchable, position
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (dataset_id, key) DO UPDATE
      SET label = EXCLUDED.label,
          type = EXCLUDED.type,
          is_filterable = EXCLUDED.is_filterable,
          is_sortable = EXCLUDED.is_sortable,
          is_searchable = EXCLUDED.is_searchable,
          position = EXCLUDED.position`,
      [
        datasetId,
        f.key,
        f.label,
        f.type,
        f.isFilterable ?? true,
        f.isSortable ?? true,
        f.isSearchable ?? false,
        i,
      ]
    );
  }
}

export async function generateRecords() {
  const startTime = Date.now();
  const targetCount = parseTargetCount();
  console.log(`Starting data generation (Target Customers: ${targetCount}, Seed: 42)...`);

  // Step 1: Ensure demo users exist
  const users = await seedUsers();
  const adminId = users.ADMIN.id;
  const analystId = users.ANALYST.id;
  const viewerId = users.VIEWER.id;

  // Step 2a: Customers Dataset + Fields
  const customersDataset = await getOrCreateDataset(
    'Customers',
    'Enterprise customer accounts and sales metrics',
    'Sales',
    'Generated',
    adminId
  );

  const customerFields = [
    { key: 'name', label: 'Customer Name', type: 'text', isFilterable: true, isSortable: true, isSearchable: true },
    { key: 'email', label: 'Email Address', type: 'text', isFilterable: true, isSortable: true, isSearchable: true },
    { key: 'company', label: 'Company', type: 'text', isFilterable: true, isSortable: true, isSearchable: true },
    { key: 'status', label: 'Status', type: 'select', isFilterable: true, isSortable: true, isSearchable: false },
    { key: 'country', label: 'Country', type: 'select', isFilterable: true, isSortable: true, isSearchable: false },
    { key: 'category', label: 'Category', type: 'select', isFilterable: true, isSortable: true, isSearchable: false },
    { key: 'revenue', label: 'Revenue ($)', type: 'number', isFilterable: true, isSortable: true, isSearchable: false },
    { key: 'signup_date', label: 'Signup Date', type: 'date', isFilterable: true, isSortable: true, isSearchable: false },
    { key: 'is_verified', label: 'Verified', type: 'boolean', isFilterable: true, isSortable: false, isSearchable: false },
  ];
  await ensureFields(customersDataset.id, customerFields);

  // Step 2b: Support Tickets Dataset (5,000 records) + Fields
  const ticketsDataset = await getOrCreateDataset(
    'Support Tickets',
    'Customer service issues and resolution times',
    'Support',
    'Generated',
    adminId
  );

  const ticketFields = [
    { key: 'title', label: 'Ticket Title', type: 'text', isFilterable: true, isSortable: true, isSearchable: true },
    { key: 'priority', label: 'Priority', type: 'select', isFilterable: true, isSortable: true, isSearchable: false },
    { key: 'status', label: 'Status', type: 'select', isFilterable: true, isSortable: true, isSearchable: false },
    { key: 'customer_name', label: 'Customer Name', type: 'text', isFilterable: true, isSortable: true, isSearchable: true },
    { key: 'assigned_to', label: 'Assigned Agent', type: 'text', isFilterable: true, isSortable: true, isSearchable: false },
    { key: 'response_time_hours', label: 'Response Time (Hours)', type: 'number', isFilterable: true, isSortable: true, isSearchable: false },
  ];
  await ensureFields(ticketsDataset.id, ticketFields);

  // Step 2h: Set permissions
  console.log('Configuring dataset permissions...');
  // Analyst: manage on Customers, view on Support Tickets
  await query(
    `INSERT INTO access_permissions (dataset_id, user_id, level)
     VALUES ($1, $2, 'manage'), ($3, $2, 'view')
     ON CONFLICT (dataset_id, user_id) DO UPDATE SET level = EXCLUDED.level`,
    [customersDataset.id, analystId, ticketsDataset.id]
  );

  // Viewer: view on Customers, NO access to Support Tickets
  await query(
    `INSERT INTO access_permissions (dataset_id, user_id, level)
     VALUES ($1, $2, 'view')
     ON CONFLICT (dataset_id, user_id) DO UPDATE SET level = EXCLUDED.level`,
    [customersDataset.id, viewerId]
  );
  await query('DELETE FROM access_permissions WHERE dataset_id = $1 AND user_id = $2', [
    ticketsDataset.id,
    viewerId,
  ]);

  // Seed with reproducible seed
  faker.seed(42);

  // Check current counts for idempotency
  const currentCustCountRes = await query(
    'SELECT COUNT(*) FROM dataset_records WHERE dataset_id = $1',
    [customersDataset.id]
  );
  const currentCustCount = parseInt(currentCustCountRes.rows[0].count, 10);

  const sampledCustomerIds = [];

  if (currentCustCount >= targetCount) {
    console.log(`[SKIP] Customers already has ${currentCustCount} records (target: ${targetCount}).`);
    // Sample existing IDs for relationships if needed
    const sampleRes = await query(
      'SELECT id FROM dataset_records WHERE dataset_id = $1 LIMIT 10000',
      [customersDataset.id]
    );
    sampledCustomerIds.push(...sampleRes.rows.map((r) => r.id));
  } else {
    const toGenerate = targetCount - currentCustCount;
    console.log(`Generating ${toGenerate} records for Customers...`);
    const batchSize = 1000;
    let inserted = 0;

    while (inserted < toGenerate) {
      const currentBatchSize = Math.min(batchSize, toGenerate - inserted);
      const batch = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const id = crypto.randomUUID();
        if (sampledCustomerIds.length < 15000 && faker.number.float() < 0.2) {
          sampledCustomerIds.push(id);
        }

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const name = `${firstName} ${lastName}`;
        const email = faker.internet.email({ firstName, lastName }).toLowerCase();
        const company = faker.company.name();
        const status = generateStatus();
        const country = faker.helpers.arrayElement(COUNTRIES);
        const category = faker.helpers.arrayElement(CATEGORIES);
        const revenue = generateRevenue();
        const { createdAt, updatedAt } = generateCreatedAt(730);
        const signupDate = createdAt.toISOString().slice(0, 10);
        const isVerified = faker.number.float() < 0.85;

        const data = {
          name,
          email,
          company,
          status,
          country,
          category,
          revenue,
          signup_date: signupDate,
          is_verified: isVerified,
        };

        const searchText = buildSearchText(data, customerFields);

        batch.push({
          id,
          data,
          searchText,
          createdAt,
          updatedAt,
        });
      }

      await withTransaction(async (client) => {
        await insertRecordsBatch(client, customersDataset.id, batch);
      });

      inserted += currentBatchSize;
      if (inserted % 10000 === 0 || inserted === toGenerate) {
        console.log(`[PROGRESS] Inserted ${inserted}/${toGenerate} Customers records...`);
      }
    }
  }

  // Step 2b: Seed Support Tickets (5,000 records)
  const currentTicketsRes = await query(
    'SELECT COUNT(*) FROM dataset_records WHERE dataset_id = $1',
    [ticketsDataset.id]
  );
  const currentTicketCount = parseInt(currentTicketsRes.rows[0].count, 10);
  const targetTickets = 5000;

  if (currentTicketCount >= targetTickets) {
    console.log(`[SKIP] Support Tickets already has ${currentTicketCount} records.`);
  } else {
    const toGenerate = targetTickets - currentTicketCount;
    console.log(`Generating ${toGenerate} records for Support Tickets...`);
    const batchSize = 1000;
    let inserted = 0;

    const agents = ['Sarah Connor', 'John Doe', 'Elena Rostova', 'Marcus Brody', 'Amina Khan'];
    const ticketStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

    while (inserted < toGenerate) {
      const currentBatchSize = Math.min(batchSize, toGenerate - inserted);
      const batch = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const id = crypto.randomUUID();
        const title = `${faker.word.adjective()} issue with ${faker.hacker.noun()}`;
        const priority = faker.helpers.arrayElement(TICKET_PRIORITIES);
        const status = faker.helpers.arrayElement(ticketStatuses);
        const customerName = faker.person.fullName();
        const assignedTo = faker.helpers.arrayElement(agents);
        const responseTime = faker.number.int({ min: 1, max: 72 });
        const { createdAt, updatedAt } = generateCreatedAt(365);

        const data = {
          title,
          priority,
          status,
          customer_name: customerName,
          assigned_to: assignedTo,
          response_time_hours: responseTime,
        };

        const searchText = buildSearchText(data, ticketFields);

        batch.push({
          id,
          data,
          searchText,
          createdAt,
          updatedAt,
        });
      }

      await withTransaction(async (client) => {
        await insertRecordsBatch(client, ticketsDataset.id, batch);
      });

      inserted += currentBatchSize;
      if (inserted % 1000 === 0 || inserted === toGenerate) {
        console.log(`[PROGRESS] Inserted ${inserted}/${toGenerate} Support Tickets records...`);
      }
    }
  }

  // Step 2g: Record Relationships (~3 per 20 records)
  const relCountRes = await query('SELECT COUNT(*) FROM record_relationships');
  const currentRelCount = parseInt(relCountRes.rows[0].count, 10);

  if (currentRelCount >= 10000 || sampledCustomerIds.length < 50) {
    console.log(`[SKIP] Record relationships already populated (${currentRelCount} existing).`);
  } else {
    console.log('Generating record relationships (referred_by, parent_company)...');
    const targetRelationships = Math.floor((sampledCustomerIds.length * 3) / 20);
    const existingPairs = new Set();
    const relBatch = [];

    for (let i = 0; i < targetRelationships; i++) {
      const sourceId = faker.helpers.arrayElement(sampledCustomerIds);
      let targetId = faker.helpers.arrayElement(sampledCustomerIds);
      if (sourceId === targetId) continue;

      const relationType = faker.datatype.boolean() ? 'referred_by' : 'parent_company';
      const key = `${sourceId}:${targetId}:${relationType}`;
      if (existingPairs.has(key)) continue;
      existingPairs.add(key);

      relBatch.push({ sourceId, targetId, relationType });
    }

    if (relBatch.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < relBatch.length; i += batchSize) {
        const slice = relBatch.slice(i, i + batchSize);
        await withTransaction(async (client) => {
          const values = [];
          const params = [];
          slice.forEach((r, idx) => {
            const base = idx * 3;
            values.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
            params.push(r.sourceId, r.targetId, r.relationType);
          });
          await client.query(
            `INSERT INTO record_relationships (source_record_id, target_record_id, relation_type)
             VALUES ${values.join(', ')}
             ON CONFLICT (source_record_id, target_record_id, relation_type) DO NOTHING`,
            params
          );
        });
      }
      console.log(`[DONE] Created ${relBatch.length} record relationships.`);
    }
  }

  // Step 2f: Recalculate totals and run ANALYZE
  console.log('Recalculating dataset record totals...');
  await recalculateTotalRecords(customersDataset.id);
  await recalculateTotalRecords(ticketsDataset.id);

  console.log('Running ANALYZE dataset_records for query planner statistics...');
  await query('ANALYZE dataset_records');

  // Step 3: Create partial expression indexes for Customers dataset
  await createCustomerIndexes(customersDataset.id);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nData generation finished successfully in ${durationSec}s.`);
}

// Allow standalone execution
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    await generateRecords();
  } catch (err) {
    console.error('[SEED ERROR]', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
