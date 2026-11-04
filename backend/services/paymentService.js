/**
 * Card payments through Stripe Checkout.
 *
 * 1. startCardCheckout: creates the order (status Pending, payment "Awaiting payment"), which
 *    takes the stock so nobody else can buy it while the shopper is paying, and a pending
 *    `payments` row, then opens a Stripe Checkout Session (open for 30 minutes).
 * 2. settleSession: called from the webhook and whenever the shopper's result page asks.
 *    A paid session whose amount, currency and order match marks the payment paid and the
 *    order Processing; an expired one gives the stock back.
 * 3. Cancelling, failed async payments and the sweep (sessions that outlived their 30 minutes
 *    without a webhook) also give the stock and the coupon use back.
 * Every change runs in a transaction that locks the payment and order rows, so the webhook and
 * the result page can arrive at the same time without double-processing anything.
 */
const { db } = require("../config/db");
const { createOrder, adjustStockForOrder, recordStatus, loadOrdersWithItems, toCents, fromCents, OrderError } = require("./orderService");
const stripe = require("./stripe");
const { queueEmail, storeUrl } = require("./email");
const { sendOrderConfirmation } = require("./notifications");

const PROVIDER = "stripe";
const CURRENCY = "USD";
const HOLD_MINUTES = 30;
const SWEEP_EVERY_MS = 5 * 60 * 1000;

const PAYMENT_LABELS = { failed: "Failed", expired: "Expired", cancelled: "Cancelled" };
const CLOSE_NOTES = {
  failed: "Card payment failed; items returned to stock",
  expired: "Card payment not completed in time; items returned to stock",
  cancelled: "Card payment cancelled; items returned to stock",
};

/** The parts of a Checkout Session worth keeping (no customer details). */
function trimSession(session, eventType) {
  return JSON.stringify({
    event: eventType || null,
    id: session.id,
    status: session.status,
    payment_status: session.payment_status,
    amount_total: session.amount_total,
    currency: session.currency,
    payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null,
    expires_at: session.expires_at,
  });
}

function describeOrder(order) {
  const items = order.lines.map((line) => `${line.quantity} × ${line.name}`).join(", ");
  const extras = [
    order.shippingCents > 0 ? `Delivery $${fromCents(order.shippingCents)}` : "Free delivery",
    order.coupon ? `${order.coupon.code} −$${fromCents(order.discountCents)}` : null,
  ].filter(Boolean);
  return `${items}. ${extras.join(", ")}.`;
}

/**
 * Creates the order and opens Stripe Checkout. Resolves to { orderId, url, totalCents }.
 * Throws OrderError for anything the shopper should see.
 */
async function startCardCheckout(userId, input) {
  if (!stripe.stripeMode().enabled) {
    throw new OrderError(503, "Card payments aren't available right now. Choose cash on delivery, or try again later.");
  }

  let order;
  let paymentId;
  let email = null;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    order = await createOrder(conn, userId, input, {
      method: "Card (Stripe)",
      status: "Awaiting payment",
      orderStatus: "Pending",
      transactionId: null,
      history: [["Pending", "Order placed, waiting for card payment"]],
    });
    const [[account]] = await conn.query("SELECT email FROM users WHERE id = ?", [userId]);
    email = account?.email || null;
    const [payment] = await conn.query(
      "INSERT INTO payments (order_id, provider, amount, currency, status) VALUES (?, ?, ?, ?, 'pending')",
      [order.orderId, PROVIDER, fromCents(order.totalCents), CURRENCY]
    );
    paymentId = payment.insertId;
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  // The Stripe call happens outside the transaction so no rows stay locked while we wait.
  try {
    const resultUrl = `${storeUrl()}/checkout/result?order=${order.orderId}`;
    const session = await stripe.createCheckoutSession({
      orderId: order.orderId,
      amountCents: order.totalCents,
      currency: CURRENCY.toLowerCase(),
      description: describeOrder(order),
      email,
      successUrl: resultUrl,
      cancelUrl: `${resultUrl}&cancelled=1`,
      expiresInMinutes: HOLD_MINUTES,
    });
    await db.query("UPDATE payments SET session_id = ?, raw_response = ? WHERE id = ?", [
      session.id,
      trimSession(session, "session.created"),
      paymentId,
    ]);
    return { orderId: order.orderId, url: session.url, totalCents: order.totalCents };
  } catch (error) {
    console.error(`[payments] Couldn't open Stripe Checkout for order #${order.orderId}:`, error.message);
    await closePayment(paymentId, "failed", "Card payment could not be started; items returned to stock");
    throw new OrderError(502, "We couldn't open the card payment page, and nothing was charged. Try again, or choose cash on delivery.");
  }
}

/**
 * Marks a pending payment failed / expired / cancelled and gives back what its order took:
 * stock (including colour stock) and the coupon use. Returns false if it wasn't pending.
 */
async function closePayment(paymentId, outcome, note = CLOSE_NOTES[outcome], rawResponse = null) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[payment]] = await conn.query(
      `SELECT p.id, p.status, p.order_id, o.status AS order_status, o.coupon_code
       FROM payments p JOIN orders o ON o.id = p.order_id
       WHERE p.id = ? FOR UPDATE`,
      [paymentId]
    );
    if (!payment || payment.status !== "pending") {
      await conn.rollback();
      return false;
    }

    await conn.query("UPDATE payments SET status = ?, raw_response = COALESCE(?, raw_response) WHERE id = ?", [
      outcome,
      rawResponse,
      paymentId,
    ]);
    if (payment.order_status !== "Cancelled") {
      await adjustStockForOrder(conn, payment.order_id, +1);
      await conn.query("UPDATE orders SET status = 'Cancelled', payment_status = ? WHERE id = ?", [
        PAYMENT_LABELS[outcome],
        payment.order_id,
      ]);
      await recordStatus(conn, payment.order_id, "Cancelled", note);
      if (payment.coupon_code) {
        await conn.query("UPDATE coupons SET used_count = GREATEST(used_count - 1, 0) WHERE code = ?", [payment.coupon_code]);
      }
    }
    await conn.commit();
    console.log(`[payments] Order #${payment.order_id}: payment ${outcome}, stock released.`);
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Applies what Stripe says about a Checkout Session. Safe to call any number of times.
 * Resolves to the payment's status afterwards, or null if the session isn't one of ours.
 */
async function settleSession(session, eventType = null) {
  if (!session?.id) return null;
  const conn = await db.getConnection();
  let outcome = null;
  let orderId = null;
  try {
    await conn.beginTransaction();
    const [[payment]] = await conn.query(
      `SELECT p.*, o.status AS order_status
       FROM payments p JOIN orders o ON o.id = p.order_id
       WHERE p.provider = ? AND p.session_id = ? FOR UPDATE`,
      [PROVIDER, session.id]
    );
    if (!payment) {
      await conn.rollback();
      return null;
    }
    orderId = payment.order_id;
    if (payment.status !== "pending") {
      await conn.rollback();
      return payment.status;
    }

    const raw = trimSession(session, eventType);
    const paid = session.status === "complete" && session.payment_status === "paid";

    if (paid) {
      const reference = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || session.id;
      const amountMatches = Number(session.amount_total) === toCents(payment.amount);
      const currencyMatches = String(session.currency || "").toUpperCase() === payment.currency;
      const orderMatches = String(session.client_reference_id) === String(payment.order_id);

      if (!amountMatches || !currencyMatches || !orderMatches) {
        // Never fulfil an order whose payment doesn't add up; leave it for a person to check.
        await conn.query("UPDATE payments SET status = 'review', transaction_ref = ?, raw_response = ? WHERE id = ?", [reference, raw, payment.id]);
        await conn.query("UPDATE orders SET payment_status = 'Needs review' WHERE id = ?", [payment.order_id]);
        await recordStatus(conn, payment.order_id, payment.order_status, "Card payment didn't match the order; held for review");
        console.error(
          `[payments] Order #${payment.order_id}: Stripe reported ${session.amount_total} ${session.currency} for order ${session.client_reference_id}, expected ${toCents(payment.amount)} ${payment.currency}. Held for review.`
        );
        outcome = "review";
      } else if (payment.order_status === "Cancelled") {
        // Paid for an order that was already cancelled (and its stock released): refund it in Stripe.
        await conn.query("UPDATE payments SET status = 'review', transaction_ref = ?, raw_response = ? WHERE id = ?", [reference, raw, payment.id]);
        await conn.query("UPDATE orders SET payment_status = 'Paid, refund needed' WHERE id = ?", [payment.order_id]);
        await recordStatus(conn, payment.order_id, "Cancelled", "Card payment arrived after the order was cancelled; refund needed");
        console.error(`[payments] Order #${payment.order_id} was paid after it was cancelled. Refund ${reference} in the Stripe dashboard.`);
        outcome = "review";
      } else {
        await conn.query("UPDATE payments SET status = 'paid', transaction_ref = ?, raw_response = ? WHERE id = ?", [reference, raw, payment.id]);
        await conn.query(
          "UPDATE orders SET payment_status = 'Paid', transaction_id = ?, status = IF(status = 'Pending', 'Processing', status) WHERE id = ?",
          [reference, payment.order_id]
        );
        if (payment.order_status === "Pending") {
          await recordStatus(conn, payment.order_id, "Processing", "Card payment confirmed");
        }
        outcome = "paid";
      }
      await conn.commit();
    } else {
      await conn.rollback();
      if (session.status === "expired") {
        await closePayment(payment.id, "expired", CLOSE_NOTES.expired, raw);
        return "expired";
      }
      return "pending";
    }
  } catch (error) {
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    conn.release();
  }

  if (outcome === "paid") {
    console.log(`[payments] Order #${orderId}: card payment confirmed.`);
    queueEmail(`order #${orderId} confirmation`, () => sendOrderConfirmation(orderId));
  }
  return outcome;
}

/** Handles one verified Stripe webhook event. Resolves to what happened, for the log. */
async function handleWebhookEvent(event) {
  const session = event?.data?.object;
  if (!session || session.object !== "checkout.session") return { ignored: event?.type || "unknown" };

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.expired":
      return { status: await settleSession(session, event.type) };
    case "checkout.session.async_payment_failed": {
      const [[payment]] = await db.query("SELECT id FROM payments WHERE provider = ? AND session_id = ?", [PROVIDER, session.id]);
      if (!payment) return { status: null };
      await closePayment(payment.id, "failed", CLOSE_NOTES.failed, trimSession(session, event.type));
      return { status: "failed" };
    }
    default:
      return { ignored: event.type };
  }
}

async function latestPaymentFor(userId, orderId) {
  const [[payment]] = await db.query(
    `SELECT p.id, p.status, p.session_id
     FROM payments p JOIN orders o ON o.id = p.order_id
     WHERE p.order_id = ? AND o.user_id = ? AND p.provider = ?
     ORDER BY p.id DESC LIMIT 1`,
    [orderId, userId, PROVIDER]
  );
  return payment || null;
}

/**
 * For the shopper's result page: asks Stripe directly while the payment is still pending (so it
 * works without webhooks in local development), then returns { status, order }.
 */
async function getPaymentForCustomer(userId, orderId) {
  let payment = await latestPaymentFor(userId, orderId);
  if (!payment) return null;

  if (payment.status === "pending" && payment.session_id && stripe.stripeMode().enabled) {
    try {
      await settleSession(await stripe.retrieveCheckoutSession(payment.session_id), "session.retrieved");
      payment = await latestPaymentFor(userId, orderId);
    } catch (error) {
      console.warn(`[payments] Couldn't check order #${orderId} with Stripe:`, error.message);
    }
  }
  const [order] = await loadOrdersWithItems("WHERE orders.id = ? AND orders.user_id = ?", [orderId, userId]);
  return { status: payment.status, order: order || null };
}

/** The shopper backed out of Stripe Checkout: close the session and give the stock back. */
async function cancelPaymentForCustomer(userId, orderId) {
  const payment = await latestPaymentFor(userId, orderId);
  if (!payment) return null;
  if (payment.status !== "pending") return payment.status;

  if (!payment.session_id) {
    await closePayment(payment.id, "cancelled");
    return "cancelled";
  }

  let expired;
  try {
    expired = await stripe.expireCheckoutSession(payment.session_id);
  } catch (error) {
    // Stripe won't expire a session that's already been paid (or it's unreachable): never give
    // the stock back on our own here. Settle whatever Stripe says; the sweep retries later.
    console.warn(`[payments] Couldn't expire the Stripe session for order #${orderId}:`, error.message);
    try {
      return (await settleSession(await stripe.retrieveCheckoutSession(payment.session_id), "session.retrieved")) || "pending";
    } catch {
      return "pending";
    }
  }
  await closePayment(payment.id, "cancelled", CLOSE_NOTES.cancelled, trimSession(expired, "session.expired_by_customer"));
  return "cancelled";
}

/**
 * Closes payments that outlived their session without a webhook (e.g. no webhook endpoint in
 * local development). Only gives stock back once Stripe confirms the session wasn't paid.
 */
async function sweepStalePayments() {
  const [stale] = await db.query(
    `SELECT id, session_id FROM payments
     WHERE provider = ? AND status = 'pending' AND created_at < NOW() - INTERVAL ? MINUTE
     ORDER BY id LIMIT 50`,
    [PROVIDER, HOLD_MINUTES + 5]
  );
  for (const payment of stale) {
    try {
      if (!payment.session_id) {
        await closePayment(payment.id, "failed", "Card payment was never started; items returned to stock");
        continue;
      }
      let session = await stripe.retrieveCheckoutSession(payment.session_id);
      if (session.status === "open") session = await stripe.expireCheckoutSession(payment.session_id);
      await settleSession(session, "sweep");
    } catch (error) {
      console.warn(`[payments] Sweep couldn't check payment ${payment.id}:`, error.message);
    }
  }
  return stale.length;
}

/** Logs whether card payments are on and starts the sweep. Call once the schema exists. */
function startPayments() {
  const mode = stripe.stripeMode();
  if (!mode.enabled) {
    console.log(`[payments] Card payments are off (${mode.reason}). Cash on delivery still works.`);
  } else {
    console.log(`[payments] Stripe ${mode.testMode ? "test mode" : "LIVE mode"} is on.`);
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.log("[payments] STRIPE_WEBHOOK_SECRET is not set: payments are confirmed when shoppers return to the store.");
    }
  }
  const run = () => sweepStalePayments().catch((error) => console.warn("[payments] Sweep failed:", error.message));
  run();
  setInterval(run, SWEEP_EVERY_MS).unref();
}

module.exports = {
  startCardCheckout,
  settleSession,
  closePayment,
  handleWebhookEvent,
  getPaymentForCustomer,
  cancelPaymentForCustomer,
  sweepStalePayments,
  startPayments,
};
