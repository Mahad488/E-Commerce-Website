/**
 * Shared order logic used by the customer routes and the admin routes,
 * so stock, shipping and coupon rules live in exactly one place.
 */
const { db } = require("../config/db");

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
 */
async function changeOrderStatus(orderId, newStatus, { note = null, onlyIfStatus = null, userId = null } = {}) {
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
    return { ok: true, status: newStatus, previous: order.status };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
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
  changeOrderStatus,
  loadOrdersWithItems,
};
