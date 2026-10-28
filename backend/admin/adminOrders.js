const express = require("express");
const { db } = require("../config/db");
const { verifyAdmin } = require("./adminAuth");

const router = express.Router();

// Apply verifyAdmin middleware to all order management routes
router.use(verifyAdmin);

/**
 * GET /api/admin/orders
 * Also supports /api/admin/orders/all
 * Fetches all orders across all users with delivery details and full line items
 */
async function getAllOrders(req, res) {
  try {
    const [orders] = await db.query(
      `SELECT orders.*, users.name as user_name, users.email as user_email 
       FROM orders 
       LEFT JOIN users ON orders.user_id = users.id 
       ORDER BY orders.created_at DESC`
    );

    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
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
        // Guarantee color is always defined for admin inspection
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
    console.error("Admin fetch orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
}

router.get("/", getAllOrders);
router.get("/all", getAllOrders);

/**
 * PATCH /api/admin/orders/:id/status
 * Updates the order fulfillment status
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
    return res.json({ success: true, message: "Order status updated successfully" });
  } catch (error) {
    console.error("Admin update status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

module.exports = router;
