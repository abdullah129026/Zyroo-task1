const express = require('express');
const { authenticate } = require('../middleware/auth');
const billingController = require('../controllers/billing.controller');

const router = express.Router();

/**
 * GET /api/billing/plans — public plan catalog with limits
 */
router.get('/plans', billingController.getPlans);

/**
 * GET /api/billing/me — current plan, status and usage
 */
router.get('/me', authenticate, billingController.getMyBilling);

/**
 * POST /api/billing/checkout — Stripe Checkout session for an upgrade
 * Body: { planId: "pro" | "team" }
 */
router.post('/checkout', authenticate, billingController.createCheckout);

/**
 * POST /api/billing/cancel — cancel the active Stripe subscription
 */
router.post('/cancel', authenticate, billingController.cancelSubscription);

module.exports = router;
