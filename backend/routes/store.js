/**
 * Smaller storefront endpoints: coupons, newsletter and the contact form.
 */
const express = require("express");
const { db } = require("../config/db");
const rateLimit = require("../middleware/rateLimit");
const { evaluateCoupon, shippingCentsFor, toCents, fromCents } = require("../services/orderService");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const formLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 15, name: "forms" });

/**
 * POST /api/coupons/validate  { code, subtotal }
 * Lets checkout preview a discount. The order route re-checks it on submit.
 */
router.post("/coupons/validate", async (req, res) => {
  const { code, subtotal } = req.body || {};
  const subtotalCents = toCents(subtotal);

  if (!Number.isFinite(subtotalCents) || subtotalCents < 0) {
    return res.status(400).json({ success: false, message: "A valid subtotal is required" });
  }

  try {
    const result = await evaluateCoupon(db, code, subtotalCents);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    const shippingCents = shippingCentsFor(subtotalCents, result.freeShipping);
    return res.json({
      success: true,
      coupon: {
        code: result.coupon.code,
        description: result.coupon.description,
        type: result.coupon.discount_type,
        value: Number(result.coupon.discount_value),
        minOrder: Number(result.coupon.min_order),
      },
      discount: fromCents(result.discountCents),
      freeShipping: result.freeShipping,
      shipping: fromCents(shippingCents),
      total: fromCents(Math.max(0, subtotalCents - result.discountCents) + shippingCents),
      message: result.coupon.description || "Coupon applied",
    });
  } catch (error) {
    console.error("Coupon validate error:", error);
    return res.status(500).json({ success: false, message: "Could not check that coupon right now" });
  }
});

/**
 * GET /api/coupons/public — active coupons to advertise on the site.
 */
router.get("/coupons/public", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT code, description, discount_type AS type, discount_value AS value, min_order AS minOrder
       FROM coupons
       WHERE active = 1 AND (expires_at IS NULL OR expires_at > NOW())
         AND (usage_limit IS NULL OR used_count < usage_limit)
       ORDER BY id ASC`
    );
    return res.json({
      success: true,
      coupons: rows.map((r) => ({ ...r, value: Number(r.value), minOrder: Number(r.minOrder) })),
    });
  } catch (error) {
    console.error("Public coupons error:", error);
    return res.status(500).json({ success: false, message: "Failed to load offers" });
  }
});

/**
 * GET /api/reviews/featured — recent 4–5 star reviews for the homepage.
 */
router.get("/reviews/featured", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.user_name AS name, r.rating, r.comment, r.created_at AS createdAt,
              p.id AS productId, p.name AS productName, p.image AS productImage, p.category
       FROM reviews r JOIN products p ON p.id = r.product_id
       WHERE r.rating >= 4 AND CHAR_LENGTH(r.comment) >= 20
       ORDER BY r.created_at DESC
       LIMIT 6`
    );
    return res.json({ success: true, reviews: rows.map((r) => ({ ...r, rating: Number(r.rating) })) });
  } catch (error) {
    console.error("Featured reviews error:", error);
    return res.status(500).json({ success: false, message: "Failed to load reviews" });
  }
});

/**
 * POST /api/newsletter  { email }
 */
router.post("/newsletter", formLimiter, async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 255) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address" });
  }

  try {
    const [result] = await db.query("INSERT IGNORE INTO newsletter_subscribers (email) VALUES (?)", [email]);
    const alreadySubscribed = result.affectedRows === 0;
    return res.status(alreadySubscribed ? 200 : 201).json({
      success: true,
      alreadySubscribed,
      couponCode: "WELCOME10",
      message: alreadySubscribed
        ? "You're already on the list — here's your code again."
        : "You're in! Use your welcome code at checkout.",
    });
  } catch (error) {
    console.error("Newsletter error:", error);
    return res.status(500).json({ success: false, message: "Could not subscribe right now" });
  }
});

/**
 * POST /api/contact  { name, email, subject, message }
 */
router.post("/contact", formLimiter, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const subject = String(req.body?.subject || "General question").trim();
  const message = String(req.body?.message || "").trim();

  if (name.length < 2 || name.length > 150) {
    return res.status(400).json({ success: false, message: "Please enter your name" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address" });
  }
  if (message.length < 10 || message.length > 3000) {
    return res.status(400).json({ success: false, message: "Your message should be between 10 and 3000 characters" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)",
      [name, email, subject.slice(0, 200), message]
    );
    return res.status(201).json({
      success: true,
      ticketId: `NOVA-${String(result.insertId).padStart(5, "0")}`,
      message: "Thanks! Our team usually replies within 24 hours.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({ success: false, message: "Could not send your message right now" });
  }
});

module.exports = router;
