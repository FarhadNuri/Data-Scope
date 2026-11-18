import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

// Hashes a plain-text password using bcrypt with configured salt rounds
export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, env.BCRYPT_ROUNDS);
}

// Securely compares a plain-text password with a stored bcrypt hash
export async function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}
