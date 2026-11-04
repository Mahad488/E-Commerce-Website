/**
 * Card payments with Stripe Checkout (test mode). See services/paymentService.js for the flow.
 */
const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/rateLimit");
const { OrderError, readOrderInput, fromCents } = require("../services/orderService");
const { stripeMode, verifyWebhookSignature } = require("../services/stripe");
const {
  startCardCheckout,
  handleWebhookEvent,
  getPaymentForCustomer,
  cancelPaymentForCustomer,
} = require("../services/paymentService");

const router = express.Router();

const checkoutLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, name: "payments" });

function parseOrderId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * GET /api/payments/config — lets checkout show or hide the card option.
 */
router.get("/config", (req, res) => {
  const mode = stripeMode();
  return res.json({ success: true, card: { provider: "stripe", enabled: mode.enabled, testMode: mode.testMode } });
});

/**
 * POST /api/payments/create-session
 * Same body as POST /api/orders. Checks the cart and stock, creates the order (Pending,
 * "Awaiting payment", stock held for 30 minutes) and returns Stripe's hosted payment page.
 * Responds { success, orderId, url, total_amount }.
 */
router.post("/create-session", verifyToken, checkoutLimiter, async (req, res) => {
  const { error, input } = readOrderInput(req.body);
  if (error) return res.status(400).json({ success: false, message: error });

  try {
    const { orderId, url, totalCents } = await startCardCheckout(req.user.id, input);
    return res.status(201).json({ success: true, orderId, url, total_amount: fromCents(totalCents) });
  } catch (err) {
    if (err instanceof OrderError) return res.status(err.status).json({ success: false, message: err.message });
    console.error("Create payment session error:", err);
    return res.status(500).json({ success: false, message: "Could not start the card payment" });
  }
});

/**
 * POST /api/payments/webhook — Stripe events, verified with STRIPE_WEBHOOK_SECRET.
 * server.js gives this route the raw body (the signature covers the exact bytes).
 */
router.post("/webhook", async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(503).json({ success: false, message: "STRIPE_WEBHOOK_SECRET is not set" });
  }

  let event;
  try {
    event = verifyWebhookSignature(req.body, req.get("stripe-signature"), secret);
  } catch (err) {
    console.warn("[payments] Rejected a webhook:", err.message);
    return res.status(400).json({ success: false, message: `Webhook signature check failed: ${err.message}` });
  }

  try {
    const result = await handleWebhookEvent(event);
    return res.json({ success: true, received: true, ...result });
  } catch (err) {
    // A 500 makes Stripe retry the event later.
    console.error(`[payments] Webhook ${event.type} failed:`, err);
    return res.status(500).json({ success: false, message: "Could not process the event" });
  }
});

/**
 * GET /api/payments/orders/:orderId — the shopper's payment status and order, for /checkout/result.
 */
router.get("/orders/:orderId", verifyToken, async (req, res) => {
  const orderId = parseOrderId(req.params.orderId);
  if (!orderId) return res.status(400).json({ success: false, message: "Invalid order ID" });
  try {
    const result = await getPaymentForCustomer(req.user.id, orderId);
    if (!result) return res.status(404).json({ success: false, message: "No card payment found for that order" });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("Payment status error:", err);
    return res.status(500).json({ success: false, message: "Could not check the payment right now" });
  }
});

/**
 * POST /api/payments/orders/:orderId/cancel — the shopper left Stripe Checkout without paying.
 */
router.post("/orders/:orderId/cancel", verifyToken, async (req, res) => {
  const orderId = parseOrderId(req.params.orderId);
  if (!orderId) return res.status(400).json({ success: false, message: "Invalid order ID" });
  try {
    const status = await cancelPaymentForCustomer(req.user.id, orderId);
    if (!status) return res.status(404).json({ success: false, message: "No card payment found for that order" });
    return res.json({ success: true, status });
  } catch (err) {
    console.error("Cancel payment error:", err);
    return res.status(500).json({ success: false, message: "Could not cancel the payment right now" });
  }
});

module.exports = router;
