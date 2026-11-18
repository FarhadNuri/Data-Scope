import { HttpError } from '../utils/http-error.js';

// Global error-handling middleware that produces standard JSON error responses
export function errorHandler(err, req, res, next) {
  // If headers were already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = 'Something went wrong';
  let details = null;

  // 1. Explicit HttpError thrown by application logic
  if (err instanceof HttpError || (err.statusCode && typeof err.statusCode === 'number')) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details || null;
  }
  // 2. Malformed JSON payload parsed by express.json()
  else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }
  // 3. PostgreSQL unique constraint violation (error code 23505)
  else if (err.code === '23505') {
    statusCode = 409;
    message = 'Already exists';
  }
  // 4. Unexpected server error
  else {
    // Log full error stack on the server only, never leaking internals to clients
    console.error('[UNHANDLED ERROR]', err);
    statusCode = 500;
    message = 'Something went wrong';
  }

  const responseBody = {
    success: false,
    error: {
      statusCode,
      message,
    },
  };

  if (details) {
    responseBody.error.details = details;
  }

  res.status(statusCode).json(responseBody);
}
