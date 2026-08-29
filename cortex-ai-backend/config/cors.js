/**
 * CORS configuration.
 * - Defaults to allowing every origin (development).
 * - Set CORS_ORIGIN in .env to a comma-separated list of allowed origins for
 *   production, e.g. CORS_ORIGIN=https://app.example.com,https://admin.example.com
 */
const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = (process.env.CORS_ORIGIN || '*')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    // Allow requests with no Origin header (curl, Postman, same-origin, etc.).
    if (allowedOrigins.includes('*') || !origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
};

module.exports = corsOptions;