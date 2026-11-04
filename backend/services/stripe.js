/**
 * The three Stripe calls the store needs (create, read and expire a Checkout Session) over
 * Stripe's REST API, plus webhook signature checks. Small enough that the SDK isn't needed.
 *
 * Only test-mode keys (sk_test_…) are accepted, except in production with STRIPE_ALLOW_LIVE=true,
 * so a portfolio deployment can't take real money by accident.
 */
const crypto = require("crypto");
const { isProduction } = require("../config/secrets");

const apiBase = () => (process.env.STRIPE_API_BASE || "https://api.stripe.com").replace(/\/+$/, "");

/** { enabled, testMode, reason? } from STRIPE_SECRET_KEY. */
function stripeMode() {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) return { enabled: false, testMode: true, reason: "STRIPE_SECRET_KEY is not set" };
  if (/^(sk|rk)_test_/.test(key)) return { enabled: true, testMode: true };
  if (/^(sk|rk)_live_/.test(key)) {
    if (isProduction && process.env.STRIPE_ALLOW_LIVE === "true") return { enabled: true, testMode: false };
    return { enabled: false, testMode: false, reason: "a live Stripe key needs NODE_ENV=production and STRIPE_ALLOW_LIVE=true" };
  }
  return { enabled: false, testMode: true, reason: "STRIPE_SECRET_KEY doesn't look like a Stripe secret key" };
}

class StripeError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Stripe's form encoding: { a: { b: [ { c: 1 } ] } } → a[b][0][c]=1 */
function toForm(params, prefix = "", out = new URLSearchParams()) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === "object") toForm(value, name, out);
    else out.append(name, String(value));
  }
  return out;
}

async function stripeRequest(method, path, params = {}, { idempotencyKey } = {}) {
  const mode = stripeMode();
  if (!mode.enabled) throw new StripeError(`Stripe is not configured: ${mode.reason}`, 503, "not_configured");

  const headers = {
    Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY.trim()}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  let res;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      method,
      headers,
      body: method === "GET" ? undefined : toForm(params).toString(),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new StripeError(`Couldn't reach Stripe: ${error.message}`, 502, "network");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new StripeError(body.error?.message || `Stripe returned ${res.status}`, res.status, body.error?.code);
  }
  return body;
}

/**
 * Creates a hosted Checkout page for one order, charged as a single line ("NOVA order #12")
 * so the amount is exactly the server's total, coupon and delivery included.
 */
function createCheckoutSession({ orderId, amountCents, currency, description, email, successUrl, cancelUrl, expiresInMinutes }) {
  return stripeRequest(
    "POST",
    "/v1/checkout/sessions",
    {
      mode: "payment",
      client_reference_id: String(orderId),
      customer_email: email || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Stripe's minimum is 30 minutes; the extra minute absorbs clock drift.
      expires_at: Math.floor(Date.now() / 1000) + expiresInMinutes * 60 + 60,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amountCents,
            product_data: { name: `NOVA order #${orderId}`, description: description.slice(0, 500) },
          },
        },
      ],
      metadata: { order_id: String(orderId) },
      payment_intent_data: { description: `NOVA order #${orderId}`, metadata: { order_id: String(orderId) } },
    },
    // Retrying the same order can never open a second session.
    { idempotencyKey: `nova-order-${orderId}-checkout` }
  );
}

const retrieveCheckoutSession = (id) => stripeRequest("GET", `/v1/checkout/sessions/${encodeURIComponent(id)}`);
const expireCheckoutSession = (id) => stripeRequest("POST", `/v1/checkout/sessions/${encodeURIComponent(id)}/expire`);

/**
 * Checks a Stripe-Signature header ("t=…,v1=…") against the raw request body and returns
 * the parsed event. Throws if the signature is wrong or older than `toleranceSeconds`.
 */
function verifyWebhookSignature(rawBody, header, secret, toleranceSeconds = 300) {
  if (!Buffer.isBuffer(rawBody)) throw new Error("Expected the raw request body");
  const pairs = String(header || "")
    .split(",")
    .map((part) => part.trim().split("="));
  const timestamp = Number(pairs.find(([key]) => key === "t")?.[1]);
  const signatures = pairs.filter(([key]) => key === "v1").map(([, value]) => value || "");
  if (!Number.isFinite(timestamp) || signatures.length === 0) throw new Error("No timestamp or v1 signature");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(Buffer.concat([Buffer.from(`${timestamp}.`), rawBody]))
    .digest("hex");
  const matches = signatures.some(
    (signature) =>
      signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  );
  if (!matches) throw new Error("Signature doesn't match");
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) throw new Error("Signature is too old");

  return JSON.parse(rawBody.toString("utf8"));
}

module.exports = {
  stripeMode,
  StripeError,
  createCheckoutSession,
  retrieveCheckoutSession,
  expireCheckoutSession,
  verifyWebhookSignature,
};
