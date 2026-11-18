import { HttpError } from '../utils/http-error.js';

// Authorization middleware restricting access based on user role.
// Must be used after the authenticate middleware has populated req.user.
export function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission'));
    }
    next();
  };
}
