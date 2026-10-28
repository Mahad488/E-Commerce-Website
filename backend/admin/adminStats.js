const express = require("express");
const { db } = require("../config/db");
const { verifyAdmin } = require("./adminAuth");

const router = express.Router();

router.use(verifyAdmin);

/**
 * GET /api/admin/stats
 * Overview dashboard metrics (revenue, orders count, product count, status distribution)
 */
router.get("/", async (req, res) => {
  try {
    const [[{ totalOrders }]] = await db.query("SELECT COUNT(*) AS totalOrders FROM orders");
    const [[{ totalRevenue }]] = await db.query("SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue FROM orders WHERE status != 'Cancelled'");
    const [[{ totalProducts }]] = await db.query("SELECT COUNT(*) AS totalProducts FROM products");
    const [[{ totalUsers }]] = await db.query("SELECT COUNT(*) AS totalUsers FROM users");

    const [statusBreakdown] = await db.query(
      "SELECT status, COUNT(*) AS count FROM orders GROUP BY status"
    );

    return res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: Number(totalRevenue),
        totalProducts,
        totalUsers,
        statusBreakdown,
      },
    });
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

module.exports = router;
