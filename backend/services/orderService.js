/**
 * Shared order logic used by the customer routes and the admin routes,
 * so stock, shipping and coupon rules live in exactly one place.
 */
const { db } = require("../config/db");
const { queueEmail } = require("./email");
const { sendOrderStatusChanged, notifiesCustomer } = require("./notifications");

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const FREE_SHIPPING_THRESHOLD = 100;
const FLAT_SHIPPING_FEE = 10;

function parseColors(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function findVariant(colors, colorName) {
  if (!colorName) return colors.length === 1 ? colors[0] : undefined;
  const match = colors.find(
    (c) => c.name && c.name.trim().toLowerCase() === String(colorName).trim().toLowerCase()
  );
  return match || (colors.length === 1 ? colors[0] : undefined);
}

const toCents = (value) => Math.round(Number(value) * 100);
const fromCents = (cents) => (cents / 100).toFixed(2);

/**
 * Validates a coupon against a subtotal (in cents).
 * Returns { coupon, discountCents, freeShipping } or { error }.
 */
async function evaluateCoupon(conn, rawCode, subtotalCents, { lock = false } = {}) {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) return { error: "Enter a coupon code" };

  const [rows] = await conn.query(
    `SELECT * FROM coupons WHERE code = ? LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [code]
  );
  const coupon = rows[0];

  if (!coupon || !coupon.active) return { error: `"${code}" is not a valid coupon` };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { error: `"${code}" has expired` };
  }
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return { error: `"${code}" has reached its usage limit` };
  }

  const minCents = toCents(coupon.min_order);
  if (subtotalCents < minCents) {
    return { error: `"${code}" needs a minimum order of $${fromCents(minCents)}` };
  }

  let discountCents = 0;
  let freeShipping = false;
  if (coupon.discount_type === "percent") {
    discountCents = Math.round((subtotalCents * Number(coupon.discount_value)) / 100);
  } else if (coupon.discount_type === "fixed") {
    discountCents = Math.min(subtotalCents, toCents(coupon.discount_value));
  } else if (coupon.discount_type === "shipping") {
    freeShipping = true;
  }

  return { coupon, discountCents, freeShipping };
}

function shippingCentsFor(subtotalCents, freeShipping) {
  if (subtotalCents === 0 || freeShipping) return 0;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD * 100 ? 0 : FLAT_SHIPPING_FEE * 100;
}

async function recordStatus(conn, orderId, status, note = null) {
  await conn.query("INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)", [
    orderId,
    status,
    note,
  ]);
}

/**
 * Adds (direction = +1) or removes (direction = -1) an order's quantities
 * back into product stock, including colour-variant stock.
 */
async function adjustStockForOrder(conn, orderId, direction) {
  const [items] = await conn.query(
    "SELECT product_id, quantity, color FROM order_items WHERE order_id = ? AND product_id IS NOT NULL",
    [orderId]
  );

  for (const item of items) {
    const [rows] = await conn.query("SELECT id, stock, colors FROM products WHERE id = ? FOR UPDATE", [
      item.product_id,
    ]);
    if (rows.length === 0) continue;

    const product = rows[0];
    const colors = parseColors(product.colors);
    const variant = findVariant(colors, item.color);
    if (variant && variant.quantity !== undefined && variant.quantity !== null) {
      variant.quantity = Math.max(0, (Number(variant.quantity) || 0) + direction * item.quantity);
    }
    const newStock = Math.max(0, (Number(product.stock) || 0) + direction * item.quantity);

    await conn.query("UPDATE products SET stock = ?, colors = ? WHERE id = ?", [
      newStock,
      colors.length > 0 ? JSON.stringify(colors) : null,
      item.product_id,
    ]);
  }
}

/**
 * Moves an order to a new status inside a transaction.
 * Cancelling restores stock; un-cancelling takes it again.
 * Cash-on-delivery orders are marked paid when delivered.
 * After the commit the customer is emailed about Processing, Shipped, Delivered and
 * Cancelled (unless notify is false); `emailNote` is added to that email.
 */
async function changeOrderStatus(
  orderId,
  newStatus,
  { note = null, onlyIfStatus = null, userId = null, notify = true, emailNote = null } = {}
) {
  if (!ORDER_STATUSES.includes(newStatus)) {
    return { ok: false, code: 400, message: `Status must be one of: ${ORDER_STATUSES.join(", ")}` };
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query("SELECT id, status, user_id FROM orders WHERE id = ? FOR UPDATE", [orderId]);
    if (rows.length === 0) {
      await conn.rollback();
      return { ok: false, code: 404, message: "Order not found" };
    }

    const order = rows[0];
    if (userId !== null && order.user_id !== userId) {
      await conn.rollback();
      return { ok: false, code: 403, message: "You can only change your own orders" };
    }
    if (onlyIfStatus && order.status !== onlyIfStatus) {
      await conn.rollback();
      return { ok: false, code: 409, message: `Order cannot be changed — it is already ${order.status}` };
    }
    if (order.status === newStatus) {
      await conn.rollback();
      return { ok: true, unchanged: true, status: newStatus };
    }

    if (newStatus === "Cancelled") {
      await adjustStockForOrder(conn, orderId, +1);
    } else if (order.status === "Cancelled") {
      await adjustStockForOrder(conn, orderId, -1);
    }

    if (newStatus === "Delivered") {
      await conn.query("UPDATE orders SET status = ?, payment_status = 'Paid' WHERE id = ?", [newStatus, orderId]);
    } else {
      await conn.query("UPDATE orders SET status = ? WHERE id = ?", [newStatus, orderId]);
    }
    await recordStatus(conn, orderId, newStatus, note);

    await conn.commit();

    const emailed = notify && notifiesCustomer(newStatus);
    if (emailed) {
      queueEmail(`order #${orderId} ${newStatus} email`, () =>
        sendOrderStatusChanged(orderId, newStatus, { note: emailNote, byCustomer: userId !== null })
      );
    }
    return { ok: true, status: newStatus, previous: order.status, emailed };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/** A problem with an order the shopper can fix (bad input, out of stock, invalid coupon). */
class OrderError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const clean = (value, max = 255) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/**
 * Checks the body of an order request (POST /api/orders and /api/payments/create-session).
 * Returns { error } or { input }.
 */
function readOrderInput(body) {
  const { items, coupon_code } = body || {};
  const input = {
    items,
    address: clean(body?.address),
    mobile: clean(body?.mobile_number, 50),
    city: clean(body?.city, 100),
    country: clean(body?.country, 100),
    couponCode: typeof coupon_code === "string" && coupon_code.trim() ? coupon_code : null,
  };

  if (!Array.isArray(items) || items.length === 0) return { error: "Cart is empty" };
  if (
    items.length > 100 ||
    items.some(
      (item) =>
        !item ||
        !Number.isSafeInteger(item.product_id) ||
        item.product_id <= 0 ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > 99
    )
  ) {
    return { error: "Order items must have a valid product_id and a quantity between 1 and 99" };
  }
  if (!input.address || !input.mobile || !input.city || !input.country) {
    return { error: "Address, mobile number, city and country are required" };
  }
  return { input };
}

/**
 * Creates an order inside the caller's transaction. Prices, shipping and coupon discounts are
 * always recalculated here; the client's totals are never trusted. Locks the products, checks
 * stock (per colour too), takes the stock, counts the coupon use and writes the order, its items
 * and its first status rows.
 *
 * payment = { method, status, orderStatus, transactionId, history: [[status, note], ...] }
 * Returns { orderId, subtotalCents, shippingCents, discountCents, totalCents, coupon, lines }.
 * Throws OrderError for problems the shopper can fix.
 */
async function createOrder(conn, userId, input, payment) {
  const uniqueProductIds = Array.from(new Set(input.items.map((item) => item.product_id)));
  const placeholders = uniqueProductIds.map(() => "?").join(", ");
  const [products] = await conn.query(
    `SELECT id, name, price, stock, colors, image FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
    uniqueProductIds
  );
  if (products.length !== uniqueProductIds.length) {
    throw new OrderError(400, "One or more products no longer exist");
  }

  const productsById = new Map(
    products.map((p) => [Number(p.id), { ...p, stock: Number(p.stock) || 0, colors: parseColors(p.colors) }])
  );

  let subtotalCents = 0;
  const orderItems = [];

  for (const item of input.items) {
    const product = productsById.get(item.product_id);
    const priceCents = toCents(product.price);

    if (product.stock < item.quantity) {
      throw new OrderError(
        409,
        `Only ${product.stock} of "${product.name}" left in stock (you requested ${item.quantity}).`
      );
    }

    let colorName = clean(item.color || item.selectedColor, 100);
    let colorImage = clean(item.color_image || item.selectedColorImage, 500);
    if (!colorName && product.colors[0]?.name) {
      colorName = product.colors[0].name;
      colorImage = colorImage || product.colors[0].image || "";
    }
    colorName = colorName || "Standard";

    const variant = findVariant(product.colors, colorName);
    if (variant && variant.quantity !== undefined && variant.quantity !== null) {
      const available = Number(variant.quantity) || 0;
      if (available < item.quantity) {
        throw new OrderError(409, `Only ${available} of "${product.name}" (${variant.name}) left in stock.`);
      }
      variant.quantity = available - item.quantity;
    }

    product.stock -= item.quantity;
    subtotalCents += priceCents * item.quantity;
    orderItems.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      priceCents,
      color: colorName,
      colorImage: colorImage || product.image || null,
    });
  }

  let discountCents = 0;
  let freeShipping = false;
  let coupon = null;
  if (input.couponCode) {
    const result = await evaluateCoupon(conn, input.couponCode, subtotalCents, { lock: true });
    if (result.error) throw new OrderError(400, result.error);
    discountCents = result.discountCents;
    freeShipping = result.freeShipping;
    coupon = result.coupon;
  }
  const shippingCents = shippingCentsFor(subtotalCents, freeShipping);
  const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents;

  const [orderResult] = await conn.query(
    `INSERT INTO orders (user_id, subtotal, shipping_fee, discount_amount, coupon_code, total_amount, status,
       address, mobile_number, city, country, payment_method, payment_status, transaction_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      fromCents(subtotalCents),
      fromCents(shippingCents),
      fromCents(discountCents),
      coupon ? coupon.code : null,
      fromCents(totalCents),
      payment.orderStatus,
      input.address,
      input.mobile,
      input.city,
      input.country,
      payment.method,
      payment.status,
      payment.transactionId,
    ]
  );
  const orderId = orderResult.insertId;

  for (const item of orderItems) {
    await conn.query(
      "INSERT INTO order_items (order_id, product_id, quantity, price, color, color_image) VALUES (?, ?, ?, ?, ?, ?)",
      [orderId, item.productId, item.quantity, fromCents(item.priceCents), item.color, item.colorImage]
    );
  }

  for (const product of productsById.values()) {
    await conn.query("UPDATE products SET stock = ?, colors = ? WHERE id = ?", [
      Math.max(0, product.stock),
      product.colors.length > 0 ? JSON.stringify(product.colors) : null,
      product.id,
    ]);
  }

  if (coupon) {
    await conn.query("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", [coupon.id]);
  }

  for (const [status, note] of payment.history) {
    await recordStatus(conn, orderId, status, note);
  }

  return {
    orderId,
    subtotalCents,
    shippingCents,
    discountCents,
    totalCents,
    coupon,
    lines: orderItems.map(({ name, quantity, priceCents, color }) => ({ name, quantity, priceCents, color })),
  };
}

/**
 * Loads orders plus their line items in two queries (no N+1).
 */
async function loadOrdersWithItems(whereSql = "", params = []) {
  const [orders] = await db.query(
    `SELECT orders.*, users.name AS user_name, users.email AS user_email
     FROM orders
     LEFT JOIN users ON orders.user_id = users.id
     ${whereSql}
     ORDER BY orders.created_at DESC, orders.id DESC`,
    params
  );
  if (orders.length === 0) return orders;

  const ids = orders.map((o) => o.id);
  const placeholders = ids.map(() => "?").join(",");
  const [items] = await db.query(
    `SELECT oi.*, p.name AS product_name, p.colors AS product_colors,
            COALESCE(oi.color_image, p.image) AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id IN (${placeholders})`,
    ids
  );

  const byOrder = new Map();
  for (const item of items) {
    if (!item.color) {
      item.color = parseColors(item.product_colors)[0]?.name || "Standard";
    }
    delete item.product_colors;
    if (!byOrder.has(item.order_id)) byOrder.set(item.order_id, []);
    byOrder.get(item.order_id).push(item);
  }
  for (const order of orders) {
    order.items = byOrder.get(order.id) || [];
  }
  return orders;
}

module.exports = {
  ORDER_STATUSES,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING_FEE,
  parseColors,
  findVariant,
  toCents,
  fromCents,
  evaluateCoupon,
  shippingCentsFor,
  recordStatus,
  adjustStockForOrder,
  changeOrderStatus,
  loadOrdersWithItems,
  OrderError,
  readOrderInput,
  createOrder,
};
