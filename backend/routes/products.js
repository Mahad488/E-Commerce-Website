const express = require("express");

const { db } = require("../config/db");
const { verifyAdmin } = require("./admin");
const { optionalToken } = require("../middleware/authMiddleware");
const { parseColors } = require("../services/orderService");

const router = express.Router();

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600";

const PRODUCT_COLUMNS = `
  p.id,
  p.name,
  p.category,
  p.description,
  p.price,
  p.old_price AS oldPrice,
  p.image,
  p.stock,
  p.rating,
  p.colors,
  p.created_at AS createdAt,
  COALESCE(r.review_count, 0) AS reviewCount,
  COALESCE(s.sold_count, 0) AS soldCount`;

const PRODUCT_JOINS = `
  LEFT JOIN (SELECT product_id, COUNT(*) AS review_count FROM reviews GROUP BY product_id) r ON r.product_id = p.id
  LEFT JOIN (
    SELECT oi.product_id, SUM(oi.quantity) AS sold_count
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status <> 'Cancelled'
    GROUP BY oi.product_id
  ) s ON s.product_id = p.id`;

function formatProduct(p) {
  return {
    ...p,
    price: Number(p.price),
    oldPrice: p.oldPrice !== null ? Number(p.oldPrice) : null,
    rating: Number(p.rating) || 0,
    stock: Number(p.stock) || 0,
    reviewCount: Number(p.reviewCount) || 0,
    soldCount: Number(p.soldCount) || 0,
    colors: parseColors(p.colors),
  };
}

const SORTS = {
  price_asc: "p.price ASC",
  price_low: "p.price ASC",
  price_desc: "p.price DESC",
  price_high: "p.price DESC",
  rating: "p.rating DESC, reviewCount DESC",
  popular: "soldCount DESC, p.rating DESC",
  discount: "(COALESCE(p.old_price, p.price) - p.price) / COALESCE(p.old_price, p.price) DESC",
  latest: "p.created_at DESC, p.id DESC",
  default: "p.created_at DESC, p.id DESC",
};

/**
 * GET /api/products?search=&category=&sort=&onSale=true
 */
router.get("/", async (req, res) => {
  try {
    const { search, category, sort, onSale } = req.query;

    if (
      (search !== undefined && typeof search !== "string") ||
      (category !== undefined && typeof category !== "string") ||
      (sort !== undefined && typeof sort !== "string")
    ) {
      return res.status(400).json({ success: false, message: "Search, category, and sort must be strings" });
    }

    const orderBy = SORTS[sort || "default"];
    if (!orderBy) {
      return res.status(400).json({ success: false, message: "Unsupported sort option" });
    }

    let query = `SELECT ${PRODUCT_COLUMNS} FROM products p ${PRODUCT_JOINS} WHERE 1 = 1`;
    const params = [];

    if (search?.trim()) {
      query += " AND (p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }
    if (category?.trim() && category.trim() !== "All") {
      query += " AND p.category = ?";
      params.push(category.trim());
    }
    if (onSale === "true") {
      query += " AND p.old_price IS NOT NULL AND p.old_price > p.price";
    }
    query += ` ORDER BY ${orderBy}`;

    const [products] = await db.query(query, params);
    return res.status(200).json({ success: true, products: products.map(formatProduct) });
  } catch (error) {
    console.error("Products fetch error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

/**
 * GET /api/products/categories — category names with product counts.
 */
router.get("/categories", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT category AS name, COUNT(*) AS count, MIN(price) AS minPrice FROM products GROUP BY category ORDER BY count DESC"
    );
    return res.json({
      success: true,
      categories: rows.map((r) => ({ name: r.name, count: Number(r.count), minPrice: Number(r.minPrice) })),
    });
  } catch (error) {
    console.error("Categories fetch error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
});

function parseId(raw) {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * GET /api/products/:id
 */
router.get("/:id", async (req, res) => {
  const productId = parseId(req.params.id);
  if (!productId) {
    return res.status(400).json({ success: false, message: "Product ID must be a positive integer" });
  }

  try {
    const [products] = await db.query(`SELECT ${PRODUCT_COLUMNS} FROM products p ${PRODUCT_JOINS} WHERE p.id = ?`, [
      productId,
    ]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, product: formatProduct(products[0]) });
  } catch (error) {
    console.error("Product fetch error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
});

/**
 * GET /api/products/:id/related — same category first, topped up with best sellers.
 */
router.get("/:id/related", async (req, res) => {
  const productId = parseId(req.params.id);
  if (!productId) return res.status(400).json({ success: false, message: "Invalid product ID" });

  try {
    const [base] = await db.query("SELECT category FROM products WHERE id = ?", [productId]);
    if (base.length === 0) return res.status(404).json({ success: false, message: "Product not found" });

    const [rows] = await db.query(
      `SELECT ${PRODUCT_COLUMNS} FROM products p ${PRODUCT_JOINS}
       WHERE p.id <> ?
       ORDER BY (p.category = ?) DESC, soldCount DESC, p.rating DESC
       LIMIT 4`,
      [productId, base[0].category]
    );
    return res.json({ success: true, products: rows.map(formatProduct) });
  } catch (error) {
    console.error("Related products error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch related products" });
  }
});

function formatReviewDate(date) {
  if (!date) return "Recently";
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} days ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function reviewStats(productId) {
  const [rows] = await db.query(
    "SELECT rating, COUNT(*) AS count FROM reviews WHERE product_id = ? GROUP BY rating",
    [productId]
  );
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  for (const row of rows) {
    const rating = Number(row.rating);
    const count = Number(row.count);
    breakdown[rating] = count;
    total += count;
    sum += rating * count;
  }
  return { totalReviews: total, averageRating: total ? Number((sum / total).toFixed(1)) : 0, breakdown };
}

/**
 * GET /api/products/:id/reviews — reviews, average, star breakdown and
 * a "verified purchase" flag for reviewers who actually bought the product.
 */
router.get("/:id/reviews", async (req, res) => {
  const productId = parseId(req.params.id);
  if (!productId) return res.status(400).json({ success: false, message: "Invalid product ID" });

  try {
    const [reviews] = await db.query(
      `SELECT r.id, r.product_id, r.user_id, r.user_name, r.rating, r.comment, r.created_at,
              EXISTS (
                SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id
                WHERE o.user_id = r.user_id AND oi.product_id = r.product_id AND o.status <> 'Cancelled'
              ) AS verified
       FROM reviews r
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );

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
        verified: Boolean(Number(r.verified)),
      })),
      ...(await reviewStats(productId)),
    });
  } catch (error) {
    console.error("Fetch reviews error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
});

/**
 * POST /api/products/:id/reviews — submit a review and refresh the product rating.
 */
router.post("/:id/reviews", optionalToken, async (req, res) => {
  const productId = parseId(req.params.id);
  if (!productId) return res.status(400).json({ success: false, message: "Invalid product ID" });

  const { name, rating, comment } = req.body || {};
  if (!comment || typeof comment !== "string" || !comment.trim()) {
    return res.status(400).json({ success: false, message: "Feedback comment is required" });
  }
  if (comment.trim().length > 1000) {
    return res.status(400).json({ success: false, message: "Reviews can be up to 1000 characters" });
  }

  const numRating = Number(rating);
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ success: false, message: "Rating must be an integer between 1 and 5" });
  }

  try {
    const userId = req.user?.id ?? null;
    let reviewerName = (typeof name === "string" ? name.trim() : "").slice(0, 100);
    if (!reviewerName && userId) {
      const [uRows] = await db.query("SELECT name FROM users WHERE id = ?", [userId]);
      reviewerName = uRows[0]?.name || "";
    }
    reviewerName = reviewerName || "Verified Customer";

    const [pRows] = await db.query("SELECT id FROM products WHERE id = ?", [productId]);
    if (pRows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const [insertResult] = await db.query(
      "INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [productId, userId, reviewerName, numRating, comment.trim()]
    );

    const stats = await reviewStats(productId);
    await db.query("UPDATE products SET rating = ? WHERE id = ?", [stats.averageRating, productId]);

    let verified = false;
    if (userId) {
      const [bought] = await db.query(
        `SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.status <> 'Cancelled' LIMIT 1`,
        [userId, productId]
      );
      verified = bought.length > 0;
    }

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
        verified,
      },
      ...stats,
    });
  } catch (error) {
    console.error("Post review error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit review" });
  }
});

// ---------------------------------------------------------------------------
// Admin product management (used by the admin portal)
// ---------------------------------------------------------------------------

function readProductBody(body = {}) {
  const { name, category, description, price, oldPrice, image, stock, rating, colors } = body;
  const errors = [];

  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanCategory = typeof category === "string" ? category.trim() : "";
  const numPrice = Number(price);
  const numOld = oldPrice === undefined || oldPrice === null || oldPrice === "" ? null : Number(oldPrice);
  const numStock = stock === undefined || stock === null || stock === "" ? 10 : Number(stock);

  if (!cleanName) errors.push("name");
  if (!cleanCategory) errors.push("category");
  if (!Number.isFinite(numPrice) || numPrice <= 0) errors.push("price (must be greater than 0)");
  if (numOld !== null && (!Number.isFinite(numOld) || numOld < 0)) errors.push("old price");
  if (!Number.isInteger(numStock) || numStock < 0) errors.push("stock (whole number, 0 or more)");

  const colorsJson = Array.isArray(colors)
    ? JSON.stringify(colors)
    : typeof colors === "string" && colors.trim()
    ? colors
    : null;

  return {
    errors,
    values: [
      cleanName,
      cleanCategory,
      typeof description === "string" ? description : "",
      numPrice,
      numOld,
      (typeof image === "string" && image.trim()) || DEFAULT_IMAGE,
      numStock,
      rating !== undefined && rating !== null && rating !== "" ? Math.min(5, Math.max(0, Number(rating) || 0)) : 0,
      colorsJson,
    ],
  };
}

router.post("/", verifyAdmin, async (req, res) => {
  try {
    const { errors, values } = readProductBody(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: `Please provide a valid ${errors.join(", ")}` });
    }
    const [result] = await db.query(
      "INSERT INTO products (name, category, description, price, old_price, image, stock, rating, colors) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      values
    );
    return res.status(201).json({ success: true, message: "Product created successfully", id: result.insertId });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ success: false, message: "Failed to create product" });
  }
});

router.put("/:id", verifyAdmin, async (req, res) => {
  const productId = parseId(req.params.id);
  if (!productId) return res.status(400).json({ success: false, message: "Invalid product ID" });

  try {
    const { errors, values } = readProductBody(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: `Please provide a valid ${errors.join(", ")}` });
    }
    const [result] = await db.query(
      `UPDATE products
       SET name = ?, category = ?, description = ?, price = ?, old_price = ?, image = ?, stock = ?, rating = ?, colors = ?
       WHERE id = ?`,
      [...values, productId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ success: false, message: "Failed to update product" });
  }
});

router.delete("/:id", verifyAdmin, async (req, res) => {
  const productId = parseId(req.params.id);
  if (!productId) return res.status(400).json({ success: false, message: "Invalid product ID" });

  try {
    const [result] = await db.query("DELETE FROM products WHERE id = ?", [productId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});

module.exports = router;
