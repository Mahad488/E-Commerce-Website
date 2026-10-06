const express = require("express");

const { db } = require("../config/db");

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

module.exports = router;
