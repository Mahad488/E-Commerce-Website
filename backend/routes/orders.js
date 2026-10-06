const express = require("express");

const { db } = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const { verifyAdmin } = require("./admin");

const router = express.Router();

router.post("/", verifyToken, async (req, res) => {
  const { items, address, mobile_number, city, country, payment_method } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Cart is empty",
    });
  }

  if (
    items.length > 100 ||
    items.some(
      (item) =>
        !item ||
        !Number.isSafeInteger(item.product_id) ||
        item.product_id <= 0 ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Order items must have a valid product_id and positive quantity",
    });
  }

  const productIds = items.map((item) => item.product_id);

  if (new Set(productIds).size !== productIds.length) {
    return res.status(400).json({
      success: false,
      message: "Each product may only appear once in the order",
    });
  }

  let connection;
  let transactionStarted = false;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const placeholders = productIds.map(() => "?").join(", ");
    const [products] = await connection.query(
      `SELECT id, price, stock FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
      productIds
    );
    const productsById = new Map(
      products.map((product) => [Number(product.id), product])
    );

    if (products.length !== productIds.length) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(400).json({
        success: false,
        message: "One or more products no longer exist",
      });
    }

    let totalCents = 0;
    const orderItems = [];

    for (const item of items) {
      const product = productsById.get(item.product_id);
      const priceCents = Math.round(Number(product.price) * 100);

      if (!Number.isFinite(priceCents) || priceCents < 0) {
        throw new Error(`Invalid database price for product ${item.product_id}`);
      }

      if (Number(product.stock) < item.quantity) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
          success: false,
          message: `Insufficient stock for product ${item.product_id}`,
        });
      }

      totalCents += priceCents * item.quantity;
      orderItems.push({
        productId: item.product_id,
        quantity: item.quantity,
        price: (priceCents / 100).toFixed(2),
      });
    }

    if (!Number.isSafeInteger(totalCents)) {
      throw new Error("Calculated order total is outside the supported range");
    }

    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, total_amount, status, address, mobile_number, city, country, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        req.user.id,
        (totalCents / 100).toFixed(2),
        "Pending",
        address || null,
        mobile_number || null,
        city || null,
        country || null,
        payment_method || "COD",
      ]
    );
    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.productId, item.quantity, item.price]
      );
      await connection.query(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.productId]
      );
    }

    await connection.commit();
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId,
      total_amount: (totalCents / 100).toFixed(2),
    });
  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
    }
    console.error("Checkout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process order",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.get("/my-orders", verifyToken, async (req, res) => {
  try {
    const [orders] = await db.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    return res.json(orders);
  } catch (error) {
    console.error("Order History Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
    });
  }
});

// Admin: Fetch all orders across all users with delivery details & items
router.get("/all", verifyAdmin, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT orders.*, users.name as user_name, users.email as user_email 
       FROM orders 
       LEFT JOIN users ON orders.user_id = users.id 
       ORDER BY orders.created_at DESC`
    );

    // Fetch order items for all orders to display in admin modal
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const placeholders = orderIds.map(() => "?").join(",");
      const [items] = await db.query(
        `SELECT oi.*, p.name as product_name, p.image as product_image 
         FROM order_items oi 
         LEFT JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id IN (${placeholders})`,
        orderIds
      );

      const itemsByOrder = new Map();
      items.forEach(item => {
        if (!itemsByOrder.has(item.order_id)) {
          itemsByOrder.set(item.order_id, []);
        }
        itemsByOrder.get(item.order_id).push(item);
      });

      orders.forEach(order => {
        order.items = itemsByOrder.get(order.id) || [];
      });
    }

    return res.json({ success: true, orders });
  } catch (error) {
    console.error("Fetch all orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// Admin: Update order status
router.patch("/:id/status", verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
    return res.json({ success: true, message: "Order status updated" });
  } catch (error) {
    console.error("Update status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

// User: Cancel an order (only if status is Pending)
router.delete("/cancel/:id", verifyToken, async (req, res) => {
  const orderId = Number(req.params.id);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  try {
    const [rows] = await db.query(
      "SELECT id, status, user_id FROM orders WHERE id = ?",
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = rows[0];

    if (order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "You can only cancel your own orders" });
    }

    if (order.status !== "Pending") {
      return res.status(403).json({
        success: false,
        message: `Order cannot be cancelled — it is already ${order.status}`,
      });
    }

    // Restore stock for each cancelled item
    const [items] = await db.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [orderId]
    );
    for (const item of items) {
      await db.query(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    await db.query("DELETE FROM order_items WHERE order_id = ?", [orderId]);
    await db.query("DELETE FROM orders WHERE id = ?", [orderId]);

    return res.json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
});

module.exports = router;
