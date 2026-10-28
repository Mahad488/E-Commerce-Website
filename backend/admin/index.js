const express = require("express");
const { authRouter, verifyAdmin } = require("./adminAuth");
const adminOrdersRouter = require("./adminOrders");
const adminProductsRouter = require("./adminProducts");
const adminStatsRouter = require("./adminStats");

const router = express.Router();

// Mount Admin Auth (e.g. /api/admin/login)
router.use("/", authRouter);

// Mount Admin Orders (e.g. /api/admin/orders, /api/admin/orders/all, /api/admin/orders/:id/status)
router.use("/orders", adminOrdersRouter);

// Mount Admin Products (e.g. /api/admin/products, /api/admin/products/:id)
router.use("/products", adminProductsRouter);

// Mount Admin Stats (e.g. /api/admin/stats)
router.use("/stats", adminStatsRouter);

module.exports = {
  adminRouter: router,
  verifyAdmin,
};
