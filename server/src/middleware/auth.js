import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';
import * as usersModel from '../modules/users/users.model.js';

// Authentication middleware verifying JWT Bearer token and loading the user from the database.
// TRADE-OFF: We perform one extra indexed lookup on the users table (by primary key id)
// on every authenticated request rather than trusting the JWT payload entirely. This ensures
// that deactivated users, deleted accounts, or revoked roles are blocked immediately rather
// than remaining valid until token expiration (up to 24 hours).
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Authentication required'));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(new HttpError(401, 'Authentication required'));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    return next(new HttpError(401, 'Invalid or expired token'));
  }

  // Find user by primary key stored in token subject ('sub')
  const user = await usersModel.findById(decoded.sub);
  if (!user || !user.isActive) {
    return next(new HttpError(401, 'User account is inactive or not found'));
  }

  // Attach safe user identity to request object
  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  next();
}
