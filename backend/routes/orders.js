const express = require("express");

const { db } = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const { verifyAdmin } = require("./admin");

/**
 * Ensure `orders` table has payment_status and transaction_id columns
 */
async function ensureOrdersColumns() {
  try {
    const cols = [
      { name: "payment_status", type: "VARCHAR(50) DEFAULT 'Pending'" },
      { name: "transaction_id", type: "VARCHAR(100) NULL" },
    ];
    for (const c of cols) {
      try {
        await db.query(`ALTER TABLE orders ADD COLUMN ${c.name} ${c.type}`);
      } catch (err) {
        // column may already exist, ignore
      }
    }
  } catch (e) {
    console.warn("Could not ensure orders table columns:", e.message);
  }
}
ensureOrdersColumns();

router.post("/", verifyToken, async (req, res) => {
  await ensureOrdersColumns();
  const { items, address, mobile_number, city, country, payment_method, payment_details } = req.body || {};

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
  const uniqueProductIds = Array.from(new Set(productIds));

  let connection;
  let transactionStarted = false;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const placeholders = uniqueProductIds.map(() => "?").join(", ");
    const [products] = await connection.query(
      `SELECT id, name, price, stock, colors, image FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
      uniqueProductIds
    );
    const productsById = new Map(
      products.map((product) => [Number(product.id), product])
    );

    if (products.length !== uniqueProductIds.length) {
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

      // Ensure color is always resolved for every ordered item
      let itemColor = item.color || item.selectedColor;
      let itemColorImage = item.color_image || item.selectedColorImage;

      if (!itemColor && product.colors) {
        try {
          const parsedColors =
            typeof product.colors === "string" ? JSON.parse(product.colors) : product.colors;
          if (Array.isArray(parsedColors) && parsedColors.length > 0 && parsedColors[0].name) {
            itemColor = parsedColors[0].name;
            if (!itemColorImage && parsedColors[0].image) {
              itemColorImage = parsedColors[0].image;
            }
          }
        } catch {
          // ignore
        }
      }

      if (!itemColor) {
        itemColor = "Standard";
      }

      totalCents += priceCents * item.quantity;
      orderItems.push({
        productId: item.product_id,
        quantity: item.quantity,
        price: (priceCents / 100).toFixed(2),
        color: itemColor,
        color_image: itemColorImage || product.image || null,
      });
    }

    if (!Number.isSafeInteger(totalCents)) {
      throw new Error("Calculated order total is outside the supported range");
    }

    const isOnlinePayment = payment_method === "card" || payment_method === "wallet";
    const paymentStatus = isOnlinePayment ? "Paid" : "Pending";
    const orderStatus = isOnlinePayment ? "Processing" : "Pending";

    let resolvedMethod = "Cash on Delivery (COD)";
    if (payment_method === "card") {
      resolvedMethod = `Credit/Debit Card (${payment_details?.cardBrand || "Card"})`;
    } else if (payment_method === "wallet") {
      resolvedMethod = `Mobile Wallet (${payment_details?.walletProvider || "JazzCash / EasyPaisa"})`;
    } else if (payment_method && typeof payment_method === "string") {
      resolvedMethod = payment_method;
    }

    const transactionId = isOnlinePayment
      ? (payment_details?.transactionId || `TXN-${payment_method === "card" ? "CARD" : "WLT"}-${Date.now().toString().slice(-7)}`)
      : `COD-${Date.now().toString().slice(-6)}`;

    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, total_amount, status, address, mobile_number, city, country, payment_method, payment_status, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        req.user.id,
        (totalCents / 100).toFixed(2),
        orderStatus,
        address || null,
        mobile_number || null,
        city || null,
        country || null,
        resolvedMethod,
        paymentStatus,
        transactionId,
      ]
    );
    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price, color, color_image) VALUES (?, ?, ?, ?, ?, ?)",
        [orderId, item.productId, item.quantity, item.price, item.color, item.color_image]
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
      status: orderStatus,
      payment_status: paymentStatus,
      payment_method: resolvedMethod,
      transaction_id: transactionId,
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

    // Fetch order items with colors and images for user profile
    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const placeholders = orderIds.map(() => "?").join(",");
      const [items] = await db.query(
        `SELECT oi.*, p.name as product_name, COALESCE(oi.color_image, p.image) as product_image 
         FROM order_items oi 
         LEFT JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id IN (${placeholders})`,
        orderIds
      );

      const itemsByOrder = new Map();
      items.forEach((item) => {
        if (!itemsByOrder.has(item.order_id)) {
          itemsByOrder.set(item.order_id, []);
        }
        itemsByOrder.get(item.order_id).push(item);
      });

      orders.forEach((order) => {
        order.items = itemsByOrder.get(order.id) || [];
      });
    }

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
        `SELECT oi.*, p.name as product_name, p.colors as product_colors, COALESCE(oi.color_image, p.image) as product_image 
         FROM order_items oi 
         LEFT JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id IN (${placeholders})`,
        orderIds
      );

      const itemsByOrder = new Map();
      items.forEach((item) => {
        if (!item.color) {
          if (item.product_colors) {
            try {
              const parsed =
                typeof item.product_colors === "string"
                  ? JSON.parse(item.product_colors)
                  : item.product_colors;
              if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
                item.color = parsed[0].name;
              }
            } catch {
              // ignore
            }
          }
          if (!item.color) {
            item.color = "Standard";
          }
        }

        if (!itemsByOrder.has(item.order_id)) {
          itemsByOrder.set(item.order_id, []);
        }
        itemsByOrder.get(item.order_id).push(item);
      });

      orders.forEach((order) => {
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
