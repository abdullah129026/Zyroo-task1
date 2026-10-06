/**
 * Plan definitions — single source of truth for subscription tiers.
 *
 * Limits are enforced per billing period by middleware/quota.js.
 * Stripe price IDs resolve from env at request time (see priceIdEnv),
 * so this module stays import-safe before dotenv runs.
 */

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceIdEnv: null, // no checkout for free
    limits: {
      maxDocuments: 5,
      maxMessages: 50, // per billing period
      maxStorageBytes: 50 * 1024 * 1024, // 50 MB
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 12,
    priceIdEnv: 'STRIPE_PRICE_PRO',
    limits: {
      maxDocuments: 100,
      maxMessages: 2000,
      maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    priceMonthly: 49,
    priceIdEnv: 'STRIPE_PRICE_TEAM',
    limits: {
      maxDocuments: 1000,
      maxMessages: 20000,
      maxStorageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    },
  },
};

/**
 * Look up a plan by id, falling back to free for unknown values.
 */
function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}

module.exports = { PLANS, getPlan };
