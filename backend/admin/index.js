const express = require("express");
const { authRouter, verifyAdmin } = require("./adminAuth");
const adminOrdersRouter = require("./adminOrders");
const adminProductsRouter = require("./adminProducts");
const adminStatsRouter = require("./adminStats");
const adminUploadsRouter = require("./adminUploads");
const adminCouponsRouter = require("./adminCoupons");

const router = express.Router();

// Mount Admin Auth (e.g. /api/admin/login)
router.use("/", authRouter);

// Mount Admin Orders (e.g. /api/admin/orders, /api/admin/orders/all, /api/admin/orders/:id/status)
router.use("/orders", adminOrdersRouter);

// Mount Admin Products (e.g. /api/admin/products, /api/admin/products/:id)
router.use("/products", adminProductsRouter);

// Mount Admin Stats (e.g. /api/admin/stats)
router.use("/stats", adminStatsRouter);

// Mount Admin Uploads (e.g. POST /api/admin/uploads)
router.use("/uploads", adminUploadsRouter);

// Mount Admin Coupons (e.g. /api/admin/coupons, /api/admin/coupons/:id/toggle)
router.use("/coupons", adminCouponsRouter);

module.exports = {
  adminRouter: router,
  verifyAdmin,
};
