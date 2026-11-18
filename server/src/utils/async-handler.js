// Wraps an async route handler/controller function.
// WHY: Express (v4/v5 callback routes) does not automatically catch rejected Promises
// thrown inside async functions unless passed to next(). This wrapper ensures that any
// thrown error or rejected promise is caught and forwarded to Express's global error handler.
export function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
