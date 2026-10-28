const express = require("express");
const jwt = require("jsonwebtoken");

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
      rating,
      colors
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
    const formattedProducts = products.map((p) => {
      let parsedColors = [];
      if (p.colors) {
        try {
          parsedColors = typeof p.colors === "string" ? JSON.parse(p.colors) : p.colors;
        } catch {
          parsedColors = [];
        }
      }
      return {
        ...p,
        colors: Array.isArray(parsedColors) ? parsedColors : [],
      };
    });

    return res.status(200).json({
      success: true,
      products: formattedProducts,
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
        rating,
        colors
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

    let parsedColors = [];
    if (products[0].colors) {
      try {
        parsedColors =
          typeof products[0].colors === "string"
            ? JSON.parse(products[0].colors)
            : products[0].colors;
      } catch {
        parsedColors = [];
      }
    }

    return res.status(200).json({
      success: true,
      product: {
        ...products[0],
        colors: Array.isArray(parsedColors) ? parsedColors : [],
      },
    });
  } catch (error) {
    console.error("Product fetch error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

/**
 * Ensure `reviews` table exists in MySQL database
 */
async function ensureReviewsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NULL,
        user_name VARCHAR(150) NOT NULL,
        rating INT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_id (product_id)
      )
    `);

    // Check if table is empty, seed initial sample reviews for products 1 & 2
    const [rows] = await db.query("SELECT id FROM reviews LIMIT 1");
    if (rows.length === 0) {
      await db.query(`
        INSERT INTO reviews (product_id, user_name, rating, comment, created_at) VALUES
        (1, 'Ahmad Hassan', 5, 'Outstanding build quality and fast shipping! Exceeded my expectations.', NOW() - INTERVAL 2 DAY),
        (1, 'Sara Khan', 4, 'Very comfortable and durable material. Highly recommended for daily use.', NOW() - INTERVAL 7 DAY),
        (2, 'Bilal Tariq', 5, 'Perfect fit and super stylish sneakers. Will definitely buy again.', NOW() - INTERVAL 3 DAY),
        (3, 'Zainab Ali', 5, 'Minimalist luxury watch at a very reasonable price.', NOW() - INTERVAL 5 DAY)
      `);
      console.log("Seeded initial product reviews into MySQL database!");
    }
  } catch (err) {
    console.warn("Could not ensure reviews table in DB:", err.message);
  }
}

// Auto-run ensureReviewsTable on startup
ensureReviewsTable();

function formatReviewDate(date) {
  if (!date) return "Recently";
  const now = new Date();
  const d = new Date(date);
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * GET /api/products/:id/reviews
 * Fetches all reviews for a product along with overall stats
 */
router.get("/:id/reviews", async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  try {
    await ensureReviewsTable();

    const [reviews] = await db.query(
      `SELECT id, product_id, user_id, user_name, rating, comment, created_at 
       FROM reviews 
       WHERE product_id = ? 
       ORDER BY created_at DESC`,
      [productId]
    );

    const count = reviews.length;
    const avgRating = count > 0 
      ? Number((reviews.reduce((acc, r) => acc + Number(r.rating), 0) / count).toFixed(1))
      : 0;

    return res.json({
      success: true,
      reviews: reviews.map((r) => ({
        id: r.id,
        productId: r.product_id,
        name: r.user_name,
        rating: Number(r.rating),
        comment: r.comment,
        createdAt: r.created_at,
        date: formatReviewDate(r.created_at),
      })),
      totalReviews: count,
      averageRating: avgRating,
    });
  } catch (error) {
    console.error("Fetch reviews error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
});

/**
 * POST /api/products/:id/reviews
 * Submits a new customer review & automatically updates product's average rating
 */
router.post("/:id/reviews", async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  const { name, rating, comment } = req.body || {};
  if (!comment || typeof comment !== "string" || !comment.trim()) {
    return res.status(400).json({ success: false, message: "Feedback comment is required" });
  }

  const numRating = Number(rating);
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ success: false, message: "Rating must be an integer between 1 and 5" });
  }

  // Check optional auth token for authenticated user
  let userId = null;
  let reviewerName = (name && typeof name === "string" ? name.trim() : "").slice(0, 100);

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "nova_jwt_secret_key");
      if (decoded && decoded.id) {
        userId = decoded.id;
        if (!reviewerName) {
          const [uRows] = await db.query("SELECT name FROM users WHERE id = ?", [userId]);
          if (uRows.length > 0) {
            reviewerName = uRows[0].name;
          }
        }
      }
    } catch {
      // Token invalid or expired, proceed with fallback
    }
  }

  if (!reviewerName) {
    reviewerName = "Verified Customer";
  }

  try {
    await ensureReviewsTable();

    // Verify product exists
    const [pRows] = await db.query("SELECT id FROM products WHERE id = ?", [productId]);
    if (pRows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const [insertResult] = await db.query(
      "INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [productId, userId, reviewerName, numRating, comment.trim()]
    );

    // Calculate new average rating for product
    const [avgRows] = await db.query(
      "SELECT COUNT(*) AS total, AVG(rating) AS avgRating FROM reviews WHERE product_id = ?",
      [productId]
    );

    const newAvg = avgRows[0].avgRating ? Number(Number(avgRows[0].avgRating).toFixed(1)) : numRating;
    const totalCount = avgRows[0].total || 1;

    // Update product's rating in products table
    await db.query("UPDATE products SET rating = ? WHERE id = ?", [newAvg, productId]);

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully! ⭐",
      review: {
        id: insertResult.insertId,
        productId,
        name: reviewerName,
        rating: numRating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
        date: "Just now",
      },
      averageRating: newAvg,
      totalReviews: totalCount,
    });
  } catch (error) {
    console.error("Post review error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit review" });
  }
});

// Admin: Add a new product
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const { name, category, description, price, oldPrice, image, stock, rating, colors } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: "Name, category and price are required" });
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
        price,
        oldPrice || null,
        image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600",
        stock || 10,
        rating !== undefined && rating !== null ? Number(rating) : 0,
        colorsJson,
      ]
    );

    return res.status(201).json({ success: true, message: "Product created successfully", id: result.insertId });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ success: false, message: "Failed to create product" });
  }
});

// Admin: Update a product (edit details, price, sales/discount, stock, colors)
router.put("/:id", verifyAdmin, async (req, res) => {
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
    console.error("Update product error:", error);
    return res.status(500).json({ success: false, message: "Failed to update product" });
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
