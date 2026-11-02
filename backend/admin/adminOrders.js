const express = require("express");
const { verifyAdmin } = require("./adminAuth");
const { changeOrderStatus, loadOrdersWithItems } = require("../services/orderService");

const router = express.Router();

router.use(verifyAdmin);

/**
 * GET /api/admin/orders  (also /api/admin/orders/all)
 * Every order with customer details and line items.
 */
async function getAllOrders(req, res) {
  try {
    const orders = await loadOrdersWithItems();
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
 * Validates the status, restores/deducts stock when cancelling or
 * un-cancelling, and records the change in the order's history.
 */
router.patch("/:id/status", async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  try {
    const result = await changeOrderStatus(orderId, req.body?.status, {
      note: `Updated by ${req.admin?.username || "admin"}`,
    });
    if (!result.ok) {
      return res.status(result.code).json({ success: false, message: result.message });
    }
    return res.json({ success: true, message: "Order status updated successfully", status: result.status });
  } catch (error) {
    console.error("Admin update status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

module.exports = router;
