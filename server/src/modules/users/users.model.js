import { query } from '../../db/pool.js';
import { calculateOffset } from '../../utils/pagination.js';
import { escapeLike } from '../../utils/escape-like.js';

// Converts a database row to the safe public user representation.
// IMPORTANT: NEVER include password_hash in this shape to prevent leaking credentials.
function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

// Finds a user by ID
export async function findById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  const row = result.rows[0];
  if (!row) return null;
  return toUser(row);
}

// Finds a user by email address (safe shape, no password hash)
export async function findByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  const row = result.rows[0];
  if (!row) return null;
  return toUser(row);
}

// Finds a user by email specifically for authentication verification.
// Returns the password hash solely for comparison during the login flow.
export async function findByEmailWithPassword(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...toUser(row),
    passwordHash: row.password_hash,
  };
}

// Creates a new user record in the database
export async function create({ name, email, passwordHash, role = 'VIEWER' }) {
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, email, passwordHash, role]
  );
  return toUser(result.rows[0]);
}

// Finds users with filtering, search, and pagination.
// Runs one query for total count and one query for rows.
export async function findMany({ page, pageSize, search, role, isActive }) {
  const conditions = [];
  const params = [];

  if (search) {
    const escaped = escapeLike(search);
    params.push(`%${escaped}%`);
    conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
  }

  if (role) {
    params.push(role);
    conditions.push(`role = $${params.length}`);
  }

  if (typeof isActive === 'boolean') {
    params.push(isActive);
    conditions.push(`is_active = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 1. Total items count matching filters
  const countResult = await query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
  const totalItems = parseInt(countResult.rows[0].count, 10);

  // 2. Paginated rows
  const offset = calculateOffset(page, pageSize);
  const queryParams = [...params, pageSize, offset];
  const rowsResult = await query(
    `SELECT * FROM users ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
    queryParams
  );

  return {
    users: rowsResult.rows.map(toUser),
    totalItems,
  };
}

// Updates user profile, role, or active status
export async function update(id, { name, isActive, role }) {
  const fields = [];
  const params = [id];

  if (name !== undefined) {
    params.push(name);
    fields.push(`name = $${params.length}`);
  }

  if (isActive !== undefined) {
    params.push(isActive);
    fields.push(`is_active = $${params.length}`);
  }

  if (role !== undefined) {
    params.push(role);
    fields.push(`role = $${params.length}`);
  }

  fields.push('updated_at = now()');

  const result = await query(
    `UPDATE users
     SET ${fields.join(', ')}
     WHERE id = $1
     RETURNING *`,
    params
  );

  const row = result.rows[0];
  if (!row) return null;
  return toUser(row);
}

// Counts currently active administrators
export async function countActiveAdmins() {
  const result = await query(
    "SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND is_active = true"
  );
  return parseInt(result.rows[0].count, 10);
}
