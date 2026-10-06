const express = require("express");

const { db } = require("../config/db");
const { verifyAdmin } = require("./admin");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    if (
      (search !== undefined && typeof search !== "string") ||
      (category !== undefined && typeof category !== "string") ||
      (sort !== undefined && typeof sort !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Search, category, and sort must be strings",
      });
    }

    let query = `SELECT
      id,
      name,
      category,
      description,
      price,
      old_price AS oldPrice,
      image,
      stock,
      rating
    FROM products
    WHERE 1 = 1`;
    const queryParams = [];

    if (search?.trim()) {
      query += " AND (name LIKE ? OR description LIKE ?)";
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (category?.trim()) {
      query += " AND category = ?";
      queryParams.push(category.trim());
    }

    switch (sort) {
      case "price_asc":
      case "price_low":
        query += " ORDER BY price ASC";
        break;
      case "price_desc":
      case "price_high":
        query += " ORDER BY price DESC";
        break;
      case "rating":
        query += " ORDER BY rating DESC";
        break;
      case "latest":
      case "default":
      case undefined:
      case "":
        query += " ORDER BY created_at DESC";
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Unsupported sort option",
        });
    }

    const [products] = await db.execute(query, queryParams);
    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Products fetch error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

router.get("/:id", async (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Product ID must be a positive integer",
    });
  }

  try {
    const [products] = await db.execute(
      `SELECT
        id,
        name,
        category,
        description,
        price,
        old_price AS oldPrice,
        image,
        stock,
        rating
      FROM products
      WHERE id = ?`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product: products[0],
    });
  } catch (error) {
    console.error("Product fetch error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

// Admin: Add a new product
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const { name, category, description, price, oldPrice, image, stock, rating } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: "Name, category and price are required" });
    }

    const [result] = await db.execute(
      "INSERT INTO products (name, category, description, price, old_price, image, stock, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        category,
        description || "",
        price,
        oldPrice || null,
        image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600",
        stock || 10,
        rating || 4.5,
      ]
    );

    return res.status(201).json({ success: true, message: "Product created successfully", id: result.insertId });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ success: false, message: "Failed to create product" });
  }
});

// Admin: Delete a product
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    await db.execute("DELETE FROM products WHERE id = ?", [req.params.id]);
    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});

module.exports = router;
