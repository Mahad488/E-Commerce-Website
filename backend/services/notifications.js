/**
 * The emails the store sends, and the data each one needs. Every function here is safe to
 * call from queueEmail(): it loads fresh data after the database commit and sends one email.
 */
const { db } = require("../config/db");
const { sendEmail, escapeHtml, storeUrl } = require("./email");

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
// Line totals in whole cents, like orderService, so 3 × $0.10 is $0.30 and not $0.30000000000000004.
const lineTotal = (item) => (Math.round(Number(item.price) * 100) * Number(item.quantity)) / 100;
const firstName = (name) => String(name || "").trim().split(/\s+/)[0] || "there";
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const cell = "padding:12px 0;border-bottom:1px solid #E4E1EE;";
const muted = "color:#5E5A73;font-size:13px;";

// Only the order number goes in the link; the shopper types their email on the page,
// so the address never ends up in URLs, browser history or analytics.
const trackUrl = (orderId) => `${storeUrl()}/track-order?orderId=${orderId}`;

async function loadOrder(orderId) {
  const [orders] = await db.query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email
     FROM orders o JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [orderId]
  );
  if (orders.length === 0) return null;
  const [items] = await db.query(
    `SELECT oi.quantity, oi.price, oi.color, COALESCE(p.name, 'Removed product') AS name
     FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [orderId]
  );
  return { order: orders[0], items };
}

function itemLines(items, { withPrices }) {
  const html = items
    .map((item) => {
      const detail = [item.color && item.color !== "Standard" ? item.color : null, `Qty ${item.quantity}`]
        .concat(withPrices ? [`${money(item.price)} each`] : [])
        .filter(Boolean)
        .join(" · ");
      const total = withPrices
        ? `<td align="right" valign="top" style="${cell}font-weight:600;white-space:nowrap;">${money(lineTotal(item))}</td>`
        : "";
      return `<tr><td style="${cell}"><div style="font-weight:600;">${escapeHtml(item.name)}</div><div style="${muted}">${escapeHtml(detail)}</div></td>${total}</tr>`;
    })
    .join("\n");
  const text = items
    .map((item) => {
      const color = item.color && item.color !== "Standard" ? ` (${item.color})` : "";
      return withPrices
        ? `- ${item.quantity} × ${item.name}${color}: ${money(lineTotal(item))}`
        : `- ${item.quantity} × ${item.name}${color}`;
    })
    .join("\n");
  return { html, text };
}

function summaryLines(order) {
  const rows = [["Subtotal", money(order.subtotal)]];
  if (Number(order.discount_amount) > 0) {
    rows.push([order.coupon_code ? `Discount (${order.coupon_code})` : "Discount", `−${money(order.discount_amount)}`]);
  }
  rows.push(["Delivery", Number(order.shipping_fee) > 0 ? money(order.shipping_fee) : "Free"]);

  const html =
    rows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:6px 0;color:#5E5A73;">${escapeHtml(label)}</td><td align="right" style="padding:6px 0;">${escapeHtml(value)}</td></tr>`
      )
      .join("\n") +
    `\n<tr><td style="padding:12px 0 0;border-top:2px solid #17132E;font-weight:800;font-size:17px;">Total (USD)</td>` +
    `<td align="right" style="padding:12px 0 0;border-top:2px solid #17132E;font-weight:800;font-size:17px;">${money(order.total_amount)}</td></tr>`;
  const text = [...rows, ["Total (USD)", money(order.total_amount)]].map(([label, value]) => `${label}: ${value}`).join("\n");
  return { html, text };
}

/** Sent once an order has been committed. */
async function sendOrderConfirmation(orderId) {
  const loaded = await loadOrder(orderId);
  if (!loaded) return;
  const { order, items } = loaded;
  const paid = order.payment_status === "Paid";
  const lines = itemLines(items, { withPrices: true });
  const summary = summaryLines(order);

  await sendEmail({
    to: order.customer_email,
    subject: `Your NOVA order #${order.id} is confirmed`,
    template: "orderConfirmation",
    data: {
      preheader: `${items.length} ${items.length === 1 ? "item" : "items"}, ${money(order.total_amount)}. We'll email you when it ships.`,
      orderId: order.id,
      placedOn: formatDate(order.created_at),
      firstName: firstName(order.customer_name),
      customerName: order.customer_name,
      intro: paid
        ? "We've received your payment and we're getting your order ready. Orders leave us within 1 business day."
        : "You'll pay when it arrives. We're getting your order ready, and orders leave us within 1 business day.",
      itemsHtml: lines.html,
      itemsText: lines.text,
      summaryHtml: summary.html,
      summaryText: summary.text,
      address: order.address,
      city: order.city,
      country: order.country,
      mobile: order.mobile_number,
      paymentMethod: order.payment_method,
      paymentStatus: paid ? "Paid" : `${money(order.total_amount)} due on delivery`,
      trackUrl: trackUrl(order.id),
    },
  });
}

const STATUS_EMAILS = {
  Processing: {
    subject: (id) => `We're getting order #${id} ready`,
    headline: "We're getting your order ready",
    message: () => "your order is confirmed and we're packing it now. We'll email you again as soon as it ships.",
    tint: "#E8EEFB",
    color: "#2453B8",
  },
  Shipped: {
    subject: (id) => `Order #${id} is on its way`,
    headline: "Your order is on its way",
    message: () => "your order has left us and usually arrives within 3–5 business days.",
    tint: "#ECEAF4",
    color: "#17132E",
  },
  Delivered: {
    subject: (id) => `Order #${id} has been delivered`,
    headline: "Your order has arrived",
    message: () =>
      "your order has been delivered. We hope you love it. If something isn't right, unused items can be returned within 30 days.",
    tint: "#E6F4EC",
    color: "#0F7A4D",
  },
  Cancelled: {
    subject: (id) => `Order #${id} has been cancelled`,
    headline: "Your order has been cancelled",
    message: (byCustomer) =>
      byCustomer
        ? "we've cancelled this order as you asked, so nothing will be shipped."
        : "we've had to cancel this order. If you didn't expect this, reply to this email and we'll sort it out.",
    tint: "#FDECEA",
    color: "#C42B1C",
  },
};

/** True for the statuses customers are emailed about. */
const notifiesCustomer = (status) => Object.prototype.hasOwnProperty.call(STATUS_EMAILS, status);

/**
 * Sent after an order moves to Processing, Shipped, Delivered or Cancelled.
 * `note` is an optional message from the store (e.g. courier and tracking number).
 */
async function sendOrderStatusChanged(orderId, status, { note = null, byCustomer = false } = {}) {
  const copy = STATUS_EMAILS[status];
  if (!copy) return;
  const loaded = await loadOrder(orderId);
  if (!loaded) return;
  const { order, items } = loaded;
  const lines = itemLines(items, { withPrices: false });
  const cleanNote = note ? String(note).trim() : "";

  await sendEmail({
    to: order.customer_email,
    subject: copy.subject(order.id),
    template: "orderStatusChanged",
    data: {
      preheader: cleanNote || copy.headline,
      orderId: order.id,
      firstName: firstName(order.customer_name),
      statusLabel: status,
      statusTint: copy.tint,
      statusColor: copy.color,
      headline: copy.headline,
      message: copy.message(byCustomer),
      noteHtml: cleanNote
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;"><tr><td style="padding:14px 16px;background:#F6F4FB;border-radius:12px;font-size:14px;line-height:1.55;"><strong style="display:block;margin-bottom:4px;">A note from us</strong>${escapeHtml(cleanNote).replace(/\n/g, "<br>")}</td></tr></table>`
        : "",
      noteText: cleanNote ? `A note from us: ${cleanNote}` : "",
      itemsHtml: lines.html,
      itemsText: lines.text,
      trackUrl: trackUrl(order.id),
    },
  });
}

/** The 6-digit code for POST /api/auth/forgot-password. */
async function sendPasswordReset({ email, name, code, expiresInMinutes }) {
  await sendEmail({
    to: email,
    subject: `${code} is your NOVA password reset code`,
    template: "passwordReset",
    data: {
      preheader: `It works for ${expiresInMinutes} minutes. Didn't ask for it? Ignore this email.`,
      firstName: firstName(name),
      code,
      expiresInMinutes,
    },
  });
}

// The topics on the Contact page (src/pages/Contact.tsx), worded to follow "getting in touch about".
const CONTACT_TOPICS = {
  "Order help": "an order",
  "Returns & refunds": "a return or refund",
  "Product question": "a product",
  "Payment issue": "a payment",
  Partnership: "a partnership",
  "Something else": "your question",
};

/**
 * Acknowledges a contact-form message. Anyone can type any address into the form, so the
 * reply never repeats what they wrote: only a known topic and the reference go in, which
 * keeps the store from being used to send someone else's text to strangers.
 */
async function sendContactAutoReply({ name, email, subject, ticketId }) {
  const topic = Object.prototype.hasOwnProperty.call(CONTACT_TOPICS, subject) ? CONTACT_TOPICS[subject] : "your question";
  await sendEmail({
    to: email,
    subject: `We've got your message (${ticketId})`,
    template: "contactAutoReply",
    data: {
      preheader: "Our team usually replies within 24 hours.",
      firstName: firstName(name).slice(0, 40),
      ticketId,
      topic,
    },
  });
}

module.exports = {
  sendOrderConfirmation,
  sendOrderStatusChanged,
  sendPasswordReset,
  sendContactAutoReply,
  notifiesCustomer,
};
