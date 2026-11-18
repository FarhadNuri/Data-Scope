import { fileURLToPath } from 'url';
import { pool, query } from '../pool.js';
import { env } from '../../config/env.js';
import { hashPassword } from '../../utils/hash.js';

// Seeds the 3 primary demo accounts (Admin, Analyst, Viewer)
export async function seedUsers() {
  console.log('Seeding demo users...');

  const demoAccounts = [
    {
      name: 'Admin User',
      email: 'admin@datascope.dev',
      role: 'ADMIN',
    },
    {
      name: 'Analyst User',
      email: 'analyst@datascope.dev',
      role: 'ANALYST',
    },
    {
      name: 'Viewer User',
      email: 'viewer@datascope.dev',
      role: 'VIEWER',
    },
  ];

  const passwordHash = await hashPassword(env.DEMO_USER_PASSWORD);
  const users = {};

  for (const account of demoAccounts) {
    // Check if user already exists (idempotent run)
    const existing = await query('SELECT id, name, email, role FROM users WHERE email = $1', [
      account.email,
    ]);

    if (existing.rows.length > 0) {
      console.log(`[SKIP] User already exists: ${account.email} (${account.role})`);
      users[account.role] = existing.rows[0];
    } else {
      const created = await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role`,
        [account.name, account.email, passwordHash, account.role]
      );
      console.log(`[CREATED] User created: ${account.email} (${account.role})`);
      users[account.role] = created.rows[0];
    }
  }

  return users;
}

// Allow standalone execution: node src/db/seeds/seed-users.js
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    await seedUsers();
    console.log('Demo user seeding finished.');
  } catch (error) {
    console.error('[SEED ERROR]', error.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
