const express = require("express");

const { db } = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const { verifyAdmin } = require("./admin");
const {
  fromCents,
  changeOrderStatus,
  loadOrdersWithItems,
  OrderError,
  readOrderInput,
  createOrder,
} = require("../services/orderService");
const { queueEmail } = require("../services/email");
const { sendOrderConfirmation } = require("../services/notifications");
const { cancelPaymentForCustomer } = require("../services/paymentService");

const router = express.Router();

/**
 * POST /api/orders
 * Places a cash-on-delivery order. Prices, shipping and coupon discounts are always
 * recalculated on the server; the client total is never trusted. Card payments go through
 * Stripe instead (POST /api/payments/create-session).
 */
router.post("/", verifyToken, async (req, res) => {
  const method = req.body?.payment_method || "cod";
  if (method !== "cod") {
    return res.status(400).json({
      success: false,
      message: "Card payments go through Stripe: use POST /api/payments/create-session. This route takes cash on delivery only.",
    });
  }
  const { error, input } = readOrderInput(req.body);
  if (error) return res.status(400).json({ success: false, message: error });

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const transactionId = `COD-${Date.now().toString().slice(-7)}`;
    const order = await createOrder(connection, req.user.id, input, {
      method: "Cash on Delivery (COD)",
      status: "Pending",
      orderStatus: "Pending",
      transactionId,
      history: [["Pending", "Order placed"]],
    });

    // The token only carries the user id; the confirmation goes to the account's email.
    const [[account]] = await connection.query("SELECT email FROM users WHERE id = ?", [req.user.id]);

    await connection.commit();
    queueEmail(`order #${order.orderId} confirmation`, () => sendOrderConfirmation(order.orderId));

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: order.orderId,
      confirmation_email: account?.email || null,
      subtotal: fromCents(order.subtotalCents),
      shipping_fee: fromCents(order.shippingCents),
      discount_amount: fromCents(order.discountCents),
      coupon_code: order.coupon ? order.coupon.code : null,
      total_amount: fromCents(order.totalCents),
      status: "Pending",
      payment_status: "Pending",
      payment_method: "Cash on Delivery (COD)",
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
    if (error instanceof OrderError) {
      return res.status(error.status).json({ success: false, message: error.message });
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
    // An order still waiting for card payment is cancelled through Stripe, so the payment
    // page closes too and the shopper can't pay for a cancelled order.
    const [[awaiting]] = await db.query(
      `SELECT p.id FROM payments p JOIN orders o ON o.id = p.order_id
       WHERE p.order_id = ? AND o.user_id = ? AND p.status = 'pending' LIMIT 1`,
      [orderId, req.user.id]
    );
    if (awaiting) {
      const status = await cancelPaymentForCustomer(req.user.id, orderId);
      if (status === "cancelled") {
        return res.json({ success: true, message: "Order cancelled successfully", status: "Cancelled", emailed: false });
      }
      return res.status(409).json({
        success: false,
        message:
          status === "paid"
            ? "This order has just been paid, so it can't be cancelled here. Contact us and we'll help."
            : "We couldn't reach the card payment provider. Try again in a minute.",
      });
    }

    const result = await changeOrderStatus(orderId, "Cancelled", {
      note: "Cancelled by customer",
      onlyIfStatus: "Pending",
      userId: req.user.id,
    });
    if (!result.ok) return res.status(result.code).json({ success: false, message: result.message });
    return res.json({ success: true, message: "Order cancelled successfully", status: "Cancelled", emailed: Boolean(result.emailed) });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
});

module.exports = router;
