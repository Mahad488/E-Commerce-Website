const express = require("express");
const { db } = require("../config/db");
const { verifyAdmin } = require("./adminAuth");

const router = express.Router();

router.use(verifyAdmin);

const LOW_STOCK_THRESHOLD = 5;

function toDayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * GET /api/admin/stats?days=14
 * Everything the analytics dashboard needs in one request.
 */
router.get("/", async (req, res) => {
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 14));

  try {
    const [[totals]] = await db.query(
      `SELECT
         COUNT(*) AS totalOrders,
         COALESCE(SUM(CASE WHEN status <> 'Cancelled' THEN total_amount END), 0) AS totalRevenue,
         COALESCE(AVG(CASE WHEN status <> 'Cancelled' THEN total_amount END), 0) AS avgOrderValue,
         COALESCE(SUM(CASE WHEN status <> 'Cancelled' THEN discount_amount END), 0) AS totalDiscounts,
         SUM(status = 'Pending') AS pendingOrders
       FROM orders`
    );
    const [[{ totalProducts }]] = await db.query("SELECT COUNT(*) AS totalProducts FROM products");
    const [[{ totalUsers }]] = await db.query("SELECT COUNT(*) AS totalUsers FROM users");
    const [[{ subscribers }]] = await db.query("SELECT COUNT(*) AS subscribers FROM newsletter_subscribers");
    const [[{ unreadMessages }]] = await db.query("SELECT COUNT(*) AS unreadMessages FROM contact_messages WHERE is_read = 0");

    const [statusBreakdown] = await db.query("SELECT status, COUNT(*) AS count FROM orders GROUP BY status");

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const [dailyRows] = await db.query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS orders,
              COALESCE(SUM(CASE WHEN status <> 'Cancelled' THEN total_amount END), 0) AS revenue
       FROM orders WHERE created_at >= ?
       GROUP BY DATE(created_at)`,
      [since]
    );
    const dailyMap = new Map(dailyRows.map((r) => [toDayKey(r.day), r]));
    const revenueByDay = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = toDayKey(d);
      const row = dailyMap.get(key);
      revenueByDay.push({ date: key, revenue: Number(row?.revenue || 0), orders: Number(row?.orders || 0) });
    }

    const [topProducts] = await db.query(
      `SELECT p.id, p.name, p.image, p.category, SUM(oi.quantity) AS unitsSold, SUM(oi.quantity * oi.price) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id AND o.status <> 'Cancelled'
       JOIN products p ON p.id = oi.product_id
       GROUP BY p.id, p.name, p.image, p.category
       ORDER BY unitsSold DESC, revenue DESC
       LIMIT 5`
    );

    const [categoryRevenue] = await db.query(
      `SELECT p.category, SUM(oi.quantity * oi.price) AS revenue, SUM(oi.quantity) AS units
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id AND o.status <> 'Cancelled'
       JOIN products p ON p.id = oi.product_id
       GROUP BY p.category
       ORDER BY revenue DESC`
    );

    const [lowStock] = await db.query(
      "SELECT id, name, image, stock, category FROM products WHERE stock <= ? ORDER BY stock ASC, name ASC LIMIT 8",
      [LOW_STOCK_THRESHOLD]
    );

    const [recentMessages] = await db.query(
      "SELECT id, name, email, subject, message, is_read AS isRead, created_at AS createdAt FROM contact_messages ORDER BY created_at DESC LIMIT 5"
    );

    return res.json({
      success: true,
      stats: {
        totalOrders: Number(totals.totalOrders),
        totalRevenue: Number(totals.totalRevenue),
        avgOrderValue: Number(totals.avgOrderValue),
        totalDiscounts: Number(totals.totalDiscounts),
        pendingOrders: Number(totals.pendingOrders || 0),
        totalProducts: Number(totalProducts),
        totalUsers: Number(totalUsers),
        subscribers: Number(subscribers),
        unreadMessages: Number(unreadMessages),
        statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: Number(s.count) })),
        revenueByDay,
        topProducts: topProducts.map((p) => ({
          ...p,
          unitsSold: Number(p.unitsSold),
          revenue: Number(p.revenue),
        })),
        categoryRevenue: categoryRevenue.map((c) => ({
          category: c.category,
          revenue: Number(c.revenue),
          units: Number(c.units),
        })),
        lowStock: lowStock.map((p) => ({ ...p, stock: Number(p.stock) })),
        lowStockThreshold: LOW_STOCK_THRESHOLD,
        recentMessages,
      },
    });
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

/**
 * PATCH /api/admin/stats/messages/:id/read — mark a contact message as read.
 */
router.patch("/messages/:id/read", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid message ID" });
  }
  try {
    await db.query("UPDATE contact_messages SET is_read = 1 WHERE id = ?", [id]);
    return res.json({ success: true });
  } catch (error) {
    console.error("Mark message read error:", error);
    return res.status(500).json({ success: false, message: "Failed to update message" });
  }
});

module.exports = router;
