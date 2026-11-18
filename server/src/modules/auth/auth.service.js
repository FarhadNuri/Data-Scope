import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { HttpError } from '../../utils/http-error.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import * as usersModel from '../users/users.model.js';

// Converts shorthand duration string (e.g. '1d', '24h') to numeric seconds
function parseExpiresInSeconds(expiryString) {
  if (typeof expiryString === 'number') return expiryString;
  if (typeof expiryString !== 'string') return 86400;
  const match = expiryString.match(/^(\d+)([smhd])$/);
  if (!match) return 86400;
  const count = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 's') return count;
  if (unit === 'm') return count * 60;
  if (unit === 'h') return count * 3600;
  if (unit === 'd') return count * 86400;
  return 86400;
}

// Registers a new user with the default 'VIEWER' role
export async function register({ name, email, password }) {
  const existingUser = await usersModel.findByEmail(email);
  if (existingUser) {
    throw new HttpError(409, 'Email is already registered');
  }

  const passwordHash = await hashPassword(password);

  // New users ALWAYS receive the VIEWER role regardless of any client input
  const user = await usersModel.create({
    name,
    email,
    passwordHash,
    role: 'VIEWER',
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// Authenticates a user and returns a signed JWT access token
export async function login({ email, password }) {
  const user = await usersModel.findByEmailWithPassword(email);

  // EARLY RETURNS: We intentionally return the identical error message
  // ("Invalid email or password") whether the email does not exist, the account
  // is deactivated, or the password is incorrect.
  // WHY: This completely prevents account enumeration attacks, where an attacker
  // would otherwise determine which emails are registered on the platform.
  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const passwordValid = await comparePassword(password, user.passwordHash);
  if (!passwordValid) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const accessToken = jwt.sign({ sub: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const expiresIn = parseExpiresInSeconds(env.JWT_EXPIRES_IN);

  return {
    accessToken,
    expiresIn,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

// Returns the authenticated user's profile
export function getCurrentUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
