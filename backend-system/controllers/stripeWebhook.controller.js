const User = require('../models/User');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return require('stripe')(key);
}

/**
 * POST /api/webhooks/stripe
 *
 * Verifies the Stripe signature against the RAW request body (this route is
 * mounted with express.raw() in app.js — never parse it as JSON first),
 * then syncs the user's plan and subscription state.
 *
 * Handled events:
 *  - checkout.session.completed   → activate the purchased plan
 *  - customer.subscription.updated → sync status and billing period
 *  - customer.subscription.deleted → drop back to free
 */
async function handleStripeWebhook(req, res) {
  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    console.error('[Stripe webhook] not configured:', err.message);
    return res.status(500).json({
      statusCode: 500,
      message: 'Stripe is not configured',
    });
  }

  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe webhook] signature verification failed:', err.message);
    return res.status(400).json({
      statusCode: 400,
      message: `Webhook signature verification failed: ${err.message}`,
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata && session.metadata.userId;
        const planId = session.metadata && session.metadata.planId;

        if (userId && ['pro', 'team'].includes(planId)) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await User.findByIdAndUpdate(userId, {
            plan: planId,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: 'active',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            'usage.documentsUploaded': 0,
            'usage.messagesSent': 0,
            'usage.storageUsed': 0,
          });
          console.log(`[Stripe webhook] user ${userId} upgraded to ${planId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata && sub.metadata.userId;

        if (userId) {
          await User.findByIdAndUpdate(userId, {
            subscriptionStatus: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          });
          console.log(`[Stripe webhook] subscription ${sub.id} updated → ${sub.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata && sub.metadata.userId;

        if (userId) {
          await User.findByIdAndUpdate(userId, {
            plan: 'free',
            stripeSubscriptionId: null,
            subscriptionStatus: 'canceled',
            currentPeriodStart: null,
            currentPeriodEnd: null,
            'usage.documentsUploaded': 0,
            'usage.messagesSent': 0,
            'usage.storageUsed': 0,
          });
          console.log(`[Stripe webhook] user ${userId} reverted to free`);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[Stripe webhook] handler error:', err);
    return res.status(500).json({
      statusCode: 500,
      message: 'Webhook handler failed',
    });
  }

  return res.status(200).json({ received: true });
}

module.exports = { handleStripeWebhook };
