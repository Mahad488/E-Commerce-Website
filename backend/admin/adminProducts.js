const express = require("express");
const { db } = require("../config/db");
const { verifyAdmin } = require("./adminAuth");

const router = express.Router();

// Apply verifyAdmin middleware to all admin product operations
router.use(verifyAdmin);

/**
 * POST /api/admin/products
 * Creates a new product catalog item
 */
router.post("/", async (req, res) => {
  try {
    const { name, category, description, price, oldPrice, image, stock, rating, colors } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: "Name, category, and price are required" });
    }

    const colorsJson = Array.isArray(colors)
      ? JSON.stringify(colors)
      : typeof colors === "string"
      ? colors
      : null;

    const [result] = await db.execute(
      "INSERT INTO products (name, category, description, price, old_price, image, stock, rating, colors) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        category,
        description || "",
        Number(price),
        oldPrice ? Number(oldPrice) : null,
        image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600",
        stock !== undefined ? Number(stock) : 10,
        rating !== undefined && rating !== null ? Number(rating) : 0,
        colorsJson,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Admin create product error:", error);
    return res.status(500).json({ success: false, message: "Failed to create product" });
  }
});

/**
 * PUT /api/admin/products/:id
 * Updates an existing product catalog item
 */
router.put("/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const { name, category, description, price, oldPrice, image, stock, rating, colors } = req.body;
    if (!name || price === undefined || price === null || !category) {
      return res.status(400).json({ success: false, message: "Name, category, and price are required" });
    }

    const [existing] = await db.execute("SELECT id FROM products WHERE id = ?", [productId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const colorsJson = Array.isArray(colors)
      ? JSON.stringify(colors)
      : typeof colors === "string"
      ? colors
      : null;

    await db.execute(
      `UPDATE products 
       SET name = ?, category = ?, description = ?, price = ?, old_price = ?, image = ?, stock = ?, rating = ?, colors = ?
       WHERE id = ?`,
      [
        name,
        category,
        description !== undefined ? description : "",
        Number(price),
        oldPrice !== undefined && oldPrice !== null && oldPrice !== "" ? Number(oldPrice) : null,
        image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600",
        stock !== undefined ? Number(stock) : 10,
        rating !== undefined && rating !== null ? Number(rating) : 0,
        colorsJson,
        productId,
      ]
    );

    return res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Admin update product error:", error);
    return res.status(500).json({ success: false, message: "Failed to update product" });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Deletes a product catalog item
 */
router.delete("/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    await db.execute("DELETE FROM products WHERE id = ?", [productId]);
    return res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Admin delete product error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});

module.exports = router;
