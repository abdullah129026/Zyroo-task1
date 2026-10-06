const express = require('express');
const { handleStripeWebhook } = require('../controllers/stripeWebhook.controller');

const router = express.Router();

/**
 * POST /api/webhooks/stripe
 *
 * Mounted with express.raw() in app.js — Stripe's signature check needs
 * the untouched request body, so this route must never see a JSON parser.
 */
router.post('/stripe', handleStripeWebhook);

module.exports = router;
