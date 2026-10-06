const express = require("express");

const { db } = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", verifyToken, async (req, res) => {
  const { items } = req.body || {};

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
      "INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)",
      [req.user.id, (totalCents / 100).toFixed(2), "Pending"]
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

module.exports = router;
