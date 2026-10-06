const User = require('../models/User');
const { PLANS, getPlan } = require('../config/plans');

/**
 * Lazily build the Stripe client so routes that don't need Stripe
 * (plans, me) keep working when the key isn't configured.
 */
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return require('stripe')(key);
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * GET /api/billing/plans — public list of tiers and their limits.
 */
async function getPlans(req, res, next) {
  try {
    const plans = Object.values(PLANS).map((p) => ({
      id: p.id,
      name: p.name,
      priceMonthly: p.priceMonthly,
      limits: p.limits,
    }));

    return res.status(200).json({
      statusCode: 200,
      data: plans,
      message: 'Plans retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/billing/me — current plan, subscription status and usage.
 */
async function getMyBilling(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ statusCode: 401, message: 'User not found' });
    }

    const plan = getPlan(user.plan);

    return res.status(200).json({
      statusCode: 200,
      data: {
        plan: plan.id,
        planName: plan.name,
        subscriptionStatus: user.subscriptionStatus,
        usage: user.usage,
        limits: plan.limits,
        currentPeriodStart: user.currentPeriodStart,
        currentPeriodEnd: user.currentPeriodEnd,
      },
      message: 'Billing status retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/billing/checkout — create a Stripe Checkout session
 * for upgrading to Pro or Team. Reuses the Stripe customer when one
 * already exists for the user.
 */
async function createCheckout(req, res, next) {
  try {
    const { planId } = req.body;

    if (!['pro', 'team'].includes(planId)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'planId must be "pro" or "team"',
      });
    }

    const plan = getPlan(planId);
    const priceId = process.env[plan.priceIdEnv];
    if (!priceId) {
      return res.status(500).json({
        statusCode: 500,
        message: `Stripe price is not configured for the ${plan.name} plan`,
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ statusCode: 401, message: 'User not found' });
    }

    const stripe = getStripe();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: user._id.toString(), planId },
      subscription_data: { metadata: { userId: user._id.toString(), planId } },
      success_url: `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/billing/cancelled`,
    });

    return res.status(200).json({
      statusCode: 200,
      data: { url: session.url, sessionId: session.id },
      message: 'Checkout session created',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/billing/cancel — cancel the Stripe subscription immediately.
 * The customer.subscription.deleted webhook moves the user back to free.
 */
async function cancelSubscription(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ statusCode: 401, message: 'User not found' });
    }

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({
        statusCode: 400,
        message: 'No active subscription to cancel',
      });
    }

    const stripe = getStripe();
    await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    return res.status(200).json({
      statusCode: 200,
      data: null,
      message: 'Subscription cancelled. Your plan will revert to Free once Stripe confirms.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPlans, getMyBilling, createCheckout, cancelSubscription };
