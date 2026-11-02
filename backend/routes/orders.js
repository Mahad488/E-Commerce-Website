const express = require("express");

const { db } = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const { verifyAdmin } = require("./admin");
const {
  parseColors,
  findVariant,
  toCents,
  fromCents,
  evaluateCoupon,
  shippingCentsFor,
  recordStatus,
  changeOrderStatus,
  loadOrdersWithItems,
} = require("../services/orderService");

const router = express.Router();

const clean = (value, max = 255) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/**
 * POST /api/orders
 * Places an order. Prices, shipping and coupon discounts are always
 * recalculated on the server — the client total is never trusted.
 */
router.post("/", verifyToken, async (req, res) => {
  const { items, payment_method, payment_details, coupon_code } = req.body || {};
  const address = clean(req.body?.address);
  const mobile = clean(req.body?.mobile_number, 50);
  const city = clean(req.body?.city, 100);
  const country = clean(req.body?.country, 100);

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is empty" });
  }

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
    return res.status(400).json({
      success: false,
      message: "Order items must have a valid product_id and a quantity between 1 and 99",
    });
  }

  if (!address || !mobile || !city || !country) {
    return res.status(400).json({
      success: false,
      message: "Address, mobile number, city and country are required",
    });
  }

  const uniqueProductIds = Array.from(new Set(items.map((item) => item.product_id)));

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const placeholders = uniqueProductIds.map(() => "?").join(", ");
    const [products] = await connection.query(
      `SELECT id, name, price, stock, colors, image FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
      uniqueProductIds
    );

    if (products.length !== uniqueProductIds.length) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "One or more products no longer exist" });
    }

    const productsById = new Map(
      products.map((p) => [Number(p.id), { ...p, stock: Number(p.stock) || 0, colors: parseColors(p.colors) }])
    );

    let subtotalCents = 0;
    const orderItems = [];

    for (const item of items) {
      const product = productsById.get(item.product_id);
      const priceCents = toCents(product.price);

      if (product.stock < item.quantity) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: `Only ${product.stock} of "${product.name}" left in stock (you requested ${item.quantity}).`,
        });
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
          await connection.rollback();
          return res.status(409).json({
            success: false,
            message: `Only ${available} of "${product.name}" (${variant.name}) left in stock.`,
          });
        }
        variant.quantity = available - item.quantity;
      }

      product.stock -= item.quantity;
      subtotalCents += priceCents * item.quantity;
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: fromCents(priceCents),
        color: colorName,
        colorImage: colorImage || product.image || null,
      });
    }

    // Coupon + shipping
    let discountCents = 0;
    let freeShipping = false;
    let appliedCoupon = null;
    if (coupon_code) {
      const result = await evaluateCoupon(connection, coupon_code, subtotalCents, { lock: true });
      if (result.error) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: result.error });
      }
      discountCents = result.discountCents;
      freeShipping = result.freeShipping;
      appliedCoupon = result.coupon;
    }
    const shippingCents = shippingCentsFor(subtotalCents, freeShipping);
    const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents;

    // Payment (card and wallet are simulated in this demo store — no card data is stored)
    const isOnline = payment_method === "card" || payment_method === "wallet";
    const paymentStatus = isOnline ? "Paid" : "Pending";
    const orderStatus = isOnline ? "Processing" : "Pending";

    let methodLabel = "Cash on Delivery (COD)";
    if (payment_method === "card") {
      methodLabel = `Credit/Debit Card (${clean(payment_details?.cardBrand, 30) || "Card"})`;
    } else if (payment_method === "wallet") {
      methodLabel = `Mobile Wallet (${clean(payment_details?.walletProvider, 30) || "JazzCash / EasyPaisa"})`;
    }

    const stamp = Date.now().toString().slice(-7);
    const transactionId = isOnline
      ? clean(payment_details?.transactionId, 100) || `TXN-${payment_method === "card" ? "CARD" : "WLT"}-${stamp}`
      : `COD-${stamp}`;

    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, subtotal, shipping_fee, discount_amount, coupon_code, total_amount, status,
         address, mobile_number, city, country, payment_method, payment_status, transaction_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        fromCents(subtotalCents),
        fromCents(shippingCents),
        fromCents(discountCents),
        appliedCoupon ? appliedCoupon.code : null,
        fromCents(totalCents),
        orderStatus,
        address,
        mobile,
        city,
        country,
        methodLabel,
        paymentStatus,
        transactionId,
      ]
    );
    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price, color, color_image) VALUES (?, ?, ?, ?, ?, ?)",
        [orderId, item.productId, item.quantity, item.price, item.color, item.colorImage]
      );
    }

    for (const product of productsById.values()) {
      await connection.query("UPDATE products SET stock = ?, colors = ? WHERE id = ?", [
        Math.max(0, product.stock),
        product.colors.length > 0 ? JSON.stringify(product.colors) : null,
        product.id,
      ]);
    }

    if (appliedCoupon) {
      await connection.query("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", [appliedCoupon.id]);
    }

    await recordStatus(connection, orderId, "Pending", "Order placed");
    if (orderStatus !== "Pending") {
      await recordStatus(connection, orderId, orderStatus, "Payment confirmed");
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId,
      subtotal: fromCents(subtotalCents),
      shipping_fee: fromCents(shippingCents),
      discount_amount: fromCents(discountCents),
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      total_amount: fromCents(totalCents),
      status: orderStatus,
      payment_status: paymentStatus,
      payment_method: methodLabel,
      transaction_id: transactionId,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // connection already closed
      }
    }
    console.error("Checkout error:", error);
    return res.status(500).json({ success: false, message: "Failed to process order" });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/orders/my-orders — the signed-in customer's orders with items.
 */
router.get("/my-orders", verifyToken, async (req, res) => {
  try {
    const orders = await loadOrdersWithItems("WHERE orders.user_id = ?", [req.user.id]);
    return res.json(orders);
  } catch (error) {
    console.error("Order history error:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching orders" });
  }
});

/**
 * GET /api/orders/track?orderId=12&email=you@example.com
 * Public order tracking. Requires the email on the account that placed the
 * order, and only returns non-sensitive details (no street address or phone).
 */
router.get("/track", async (req, res) => {
  const orderId = Number(String(req.query.orderId || "").replace(/^#/, ""));
  const email = String(req.query.email || "").trim().toLowerCase();

  if (!Number.isSafeInteger(orderId) || orderId <= 0 || !email) {
    return res.status(400).json({ success: false, message: "Order number and email are required" });
  }

  try {
    const [rows] = await db.query(
      `SELECT o.id, o.status, o.payment_status, o.payment_method, o.total_amount, o.city, o.country,
              o.created_at, o.updated_at, u.email
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.id = ? LIMIT 1`,
      [orderId]
    );

    if (rows.length === 0 || rows[0].email.toLowerCase() !== email) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find an order with that number and email. Check both and try again.",
      });
    }

    const order = rows[0];
    const [history] = await db.query(
      "SELECT status, note, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC, id ASC",
      [orderId]
    );
    const [items] = await db.query(
      `SELECT oi.quantity, oi.color, COALESCE(oi.color_image, p.image) AS image, p.name
       FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    return res.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        total: order.total_amount,
        destination: [order.city, order.country].filter(Boolean).join(", "),
        placedAt: order.created_at,
        updatedAt: order.updated_at,
        history: history.length > 0 ? history : [{ status: "Pending", note: "Order placed", created_at: order.created_at }],
        items: items.map((item) => ({
          name: item.name || "Removed product",
          quantity: item.quantity,
          color: item.color,
          image: item.image,
        })),
      },
    });
  } catch (error) {
    console.error("Track order error:", error);
    return res.status(500).json({ success: false, message: "Could not look up the order right now" });
  }
});

/**
 * Admin: list every order. Kept for the existing admin portal
 * (the same data is also served at /api/admin/orders).
 */
router.get("/all", verifyAdmin, async (req, res) => {
  try {
    const orders = await loadOrdersWithItems();
    return res.json({ success: true, orders });
  } catch (error) {
    console.error("Fetch all orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

/**
 * Admin: update order status (validated, stock-aware, logged to history).
 */
router.patch("/:id/status", verifyAdmin, async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }
  try {
    const result = await changeOrderStatus(orderId, req.body?.status, { note: "Updated by admin" });
    if (!result.ok) return res.status(result.code).json({ success: false, message: result.message });
    return res.json({ success: true, message: "Order status updated", status: result.status });
  } catch (error) {
    console.error("Update status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

/**
 * Customer: cancel a Pending order. The order is kept (status "Cancelled")
 * so it stays in the customer's history, and its stock is restored.
 */
router.delete("/cancel/:id", verifyToken, async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }
  try {
    const result = await changeOrderStatus(orderId, "Cancelled", {
      note: "Cancelled by customer",
      onlyIfStatus: "Pending",
      userId: req.user.id,
    });
    if (!result.ok) return res.status(result.code).json({ success: false, message: result.message });
    return res.json({ success: true, message: "Order cancelled successfully", status: "Cancelled" });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
});

module.exports = router;
