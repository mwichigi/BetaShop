// ============================================================
// βetaShop — Stripe Payments Route
// POST /api/payments/create-intent   → create PaymentIntent
// POST /api/payments/webhook         → handle Stripe webhooks
// ============================================================

const router  = require('express').Router();
const db      = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Lazy-load Stripe so server starts without key
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe key not configured');
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// POST /api/payments/create-intent
router.post('/create-intent', authMiddleware, async (req, res) => {
  try {
    const stripe = getStripe();
    const { items } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'No items' });

    const amount = Math.round(
      items.reduce((s, i) => s + parseFloat(i.price) * (i.qty || 1), 0) * 100
    );

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { user_id: String(req.user.id) },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: intent.client_secret, amount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/payments/webhook — Stripe sends events here
router.post('/webhook', require('express').raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    console.log('Payment succeeded:', intent.id, '$' + (intent.amount / 100));
    // TODO: fulfill order, send email, etc.
  }

  res.json({ received: true });
});

module.exports = router;
