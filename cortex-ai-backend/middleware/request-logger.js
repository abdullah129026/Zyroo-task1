/**
 * Simple request logger.
 * Logs method, URL, response status and duration for every incoming request.
 */
const requestLogger = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`
    );
  });

  next();
};

module.exports = requestLogger;