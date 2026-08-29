/**
 * 404 handler - catches requests that matched no route.
 * Passes a 404 error to the global error handler.
 */
const notFound = (req, _res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};
/**
 * Global error-handling middleware.
 * Returns consistent JSON error responses for every error in the app.
 * Stack traces are only exposed in development.
 */
const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    console.error(`[ERROR] ${err.stack || err.message}`);
  }
  const body = {
    success: false,
    message:
      statusCode >= 500
        ? isProduction
          ? 'Internal Server Error'
          : err.message
        : err.message,
  };

  if (!isProduction && err.stack) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };