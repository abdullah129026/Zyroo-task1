const rateLimit = require('express-rate-limit');

/**
 * Rate limiting (Weeks 7-8 security hardening).
 *
 * Three tiers:
 *  - globalLimiter: a loose ceiling on every route, blunts scraping and
 *    scripted abuse.
 *  - authLimiter: tight, credential endpoints are the brute-force target.
 *  - llmLimiter: applied to chat and search, because every call there has
 *    a real per-token dollar cost behind it. The per-user plan quota is
 *    still the primary control; this stops one IP from burning through
 *    many accounts' quotas at machine speed.
 *
 * Set DISABLE_RATE_LIMITS=true to skip all tiers (used by the automated
 * test suite; never in production).
 */
const skip = () => process.env.DISABLE_RATE_LIMITS === 'true';

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: {
    statusCode: 429,
    message: 'Too many requests. Please slow down and try again shortly.',
  },
};

const globalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 600,
});

const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 50,
});

const llmLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 120,
});

module.exports = { globalLimiter, authLimiter, llmLimiter };
