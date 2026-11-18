import { HttpError } from '../utils/http-error.js';

// Catches unhandled routes and forwards a 404 HttpError to the global error handler
export function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}
