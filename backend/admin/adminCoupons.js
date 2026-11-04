const express = require("express");
const { db } = require("../config/db");
const { verifyAdmin } = require("./adminAuth");

const router = express.Router();

router.use(verifyAdmin);

const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,29}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DISCOUNT_TYPES = ["percent", "fixed", "shipping"];

// expires_at goes out as "YYYY-MM-DD" (the last day the code works) so the admin form never
// has to deal with time zones; is_expired uses the same NOW() check as the public routes.
const COUPON_COLUMNS = `
  c.id, c.code, c.description, c.discount_type, c.discount_value, c.min_order,
  c.usage_limit, c.used_count, c.active, c.created_at,
  DATE_FORMAT(c.expires_at, '%Y-%m-%d') AS expires_at,
  (c.expires_at IS NOT NULL AND c.expires_at <= NOW()) AS is_expired`;

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const money = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** Same wording as the seeded coupons, e.g. "20% off orders over $150". */
function describeCoupon(type, value, minOrder) {
  const where = minOrder > 0 ? `orders over ${money(minOrder)}` : "any order";
  if (type === "shipping") return `Free shipping on ${where}`;
  return `${type === "percent" ? `${value}%` : money(value)} off ${where}`;
}

function statusOf(row) {
  if (Number(row.is_expired)) return "expired";
  if (!row.active) return "paused";
  if (row.usage_limit !== null && row.used_count >= row.usage_limit) return "used_up";
  return "active";
}

function toCoupon(row) {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discount_type: row.discount_type,
    discount_value: Number(row.discount_value),
    min_order: Number(row.min_order),
    usage_limit: row.usage_limit === null ? null : Number(row.usage_limit),
    used_count: Number(row.used_count),
    expires_at: row.expires_at,
    active: Boolean(row.active),
    status: statusOf(row),
    created_at: row.created_at,
  };
}

async function findCoupon(id) {
  const [rows] = await db.query(`SELECT ${COUPON_COLUMNS} FROM coupons c WHERE c.id = ?`, [id]);
  return rows[0] ? toCoupon(rows[0]) : null;
}

function localToday() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

/**
 * Validates a create/update body. `existing` is the stored coupon when updating:
 * its expiry may stay in the past, but a new expiry has to be today or later.
 * Returns { errors } (field → sentence) or { values }.
 */
function readCouponBody(body, existing = null) {
  const errors = {};
  const input = body || {};

  const code = String(input.code ?? "").trim().toUpperCase();
  if (!CODE_RE.test(code)) {
    errors.code = "Use 3–30 letters or numbers (dashes and underscores are fine), starting with a letter or number.";
  }

  const type = String(input.discount_type ?? "");
  if (!DISCOUNT_TYPES.includes(type)) {
    errors.discount_type = "Choose percent off, amount off or free shipping.";
  }

  let value = 0;
  if (type === "percent" || type === "fixed") {
    value = Math.round(Number(input.discount_value) * 100) / 100;
    if (type === "percent" && !(value > 0 && value <= 100)) {
      errors.discount_value = "Enter a percentage between 1 and 100.";
    } else if (type === "fixed" && !(value > 0 && value <= 100000)) {
      errors.discount_value = "Enter an amount greater than $0.";
    }
  }

  const minOrder = isBlank(input.min_order) ? 0 : Math.round(Number(input.min_order) * 100) / 100;
  if (!Number.isFinite(minOrder) || minOrder < 0 || minOrder > 1000000) {
    errors.min_order = "Enter a minimum order of $0 or more, or leave it empty.";
  }

  const usageLimit = isBlank(input.usage_limit) ? null : Number(input.usage_limit);
  if (usageLimit !== null && !(Number.isInteger(usageLimit) && usageLimit >= 1 && usageLimit <= 1000000)) {
    errors.usage_limit = "Enter a whole number of uses (1 or more), or leave it empty for no limit.";
  }

  const expiresOn = isBlank(input.expires_at) ? null : String(input.expires_at).trim().slice(0, 10);
  if (expiresOn !== null) {
    const valid = DATE_RE.test(expiresOn) && !Number.isNaN(new Date(`${expiresOn}T00:00:00`).getTime());
    const unchanged = existing && existing.expires_at === expiresOn;
    if (!valid) {
      errors.expires_at = "Pick a valid date, or leave it empty for no expiry.";
    } else if (!unchanged && expiresOn < localToday()) {
      errors.expires_at = "Pick today or a later date, or leave it empty for no expiry.";
    }
  }

  const description = String(input.description ?? "").trim();
  if (description.length > 255) {
    errors.description = "Keep the description under 255 characters.";
  }

  const active = input.active === undefined ? (existing ? existing.active : true) : Boolean(input.active);

  if (Object.keys(errors).length) return { errors };

  return {
    values: {
      code,
      description: description || describeCoupon(type, value, minOrder),
      discount_type: type,
      discount_value: value,
      min_order: minOrder,
      usage_limit: usageLimit,
      // The code works through the whole of its last day.
      expires_at: expiresOn ? `${expiresOn} 23:59:59` : null,
      active: active ? 1 : 0,
    },
  };
}

function sendValidationErrors(res, errors) {
  return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
}

function sendDuplicateCode(res, code) {
  return res.status(409).json({
    success: false,
    message: `There's already a coupon called ${code}. Choose another code.`,
    errors: { code: `There's already a coupon called ${code}.` },
  });
}

/**
 * GET /api/admin/coupons — every coupon, newest first, with used_count and a status:
 * active | paused | expired | used_up.
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT ${COUPON_COLUMNS} FROM coupons c ORDER BY c.created_at DESC, c.id DESC`);
    return res.json({ success: true, coupons: rows.map(toCoupon) });
  } catch (error) {
    console.error("Admin list coupons error:", error);
    return res.status(500).json({ success: false, message: "Failed to load coupons" });
  }
});

/**
 * POST /api/admin/coupons
 * { code, discount_type, discount_value, min_order?, usage_limit?, expires_at? (YYYY-MM-DD), description?, active? }
 */
router.post("/", async (req, res) => {
  const { errors, values } = readCouponBody(req.body);
  if (errors) return sendValidationErrors(res, errors);

  try {
    const [result] = await db.query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_order, usage_limit, expires_at, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        values.code,
        values.description,
        values.discount_type,
        values.discount_value,
        values.min_order,
        values.usage_limit,
        values.expires_at,
        values.active,
      ]
    );
    return res.status(201).json({ success: true, message: "Coupon created", coupon: await findCoupon(result.insertId) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return sendDuplicateCode(res, values.code);
    console.error("Admin create coupon error:", error);
    return res.status(500).json({ success: false, message: "Failed to create coupon" });
  }
});

/**
 * PUT /api/admin/coupons/:id — replaces the coupon's settings (used_count is kept).
 */
router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ success: false, message: "Invalid coupon ID" });

  try {
    const existing = await findCoupon(id);
    if (!existing) return res.status(404).json({ success: false, message: "Coupon not found" });

    const { errors, values } = readCouponBody(req.body, existing);
    if (errors) return sendValidationErrors(res, errors);

    await db.query(
      `UPDATE coupons
       SET code = ?, description = ?, discount_type = ?, discount_value = ?, min_order = ?,
           usage_limit = ?, expires_at = ?, active = ?
       WHERE id = ?`,
      [
        values.code,
        values.description,
        values.discount_type,
        values.discount_value,
        values.min_order,
        values.usage_limit,
        values.expires_at,
        values.active,
        id,
      ]
    );
    return res.json({ success: true, message: "Coupon updated", coupon: await findCoupon(id) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return sendDuplicateCode(res, String(req.body?.code || "").trim().toUpperCase());
    console.error("Admin update coupon error:", error);
    return res.status(500).json({ success: false, message: "Failed to update coupon" });
  }
});

/**
 * PATCH /api/admin/coupons/:id/toggle — pauses or resumes a coupon.
 * Body { active: true|false } sets it; an empty body flips it.
 */
router.patch("/:id/toggle", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ success: false, message: "Invalid coupon ID" });

  const wanted = req.body?.active;
  try {
    const [result] =
      typeof wanted === "boolean" || wanted === 0 || wanted === 1
        ? await db.query("UPDATE coupons SET active = ? WHERE id = ?", [wanted ? 1 : 0, id])
        : await db.query("UPDATE coupons SET active = 1 - active WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Coupon not found" });

    const coupon = await findCoupon(id);
    return res.json({ success: true, message: coupon.active ? "Coupon resumed" : "Coupon paused", coupon });
  } catch (error) {
    console.error("Admin toggle coupon error:", error);
    return res.status(500).json({ success: false, message: "Failed to update coupon" });
  }
});

/**
 * DELETE /api/admin/coupons/:id — orders that used the code keep their discount and code.
 */
router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ success: false, message: "Invalid coupon ID" });

  try {
    const [result] = await db.query("DELETE FROM coupons WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Coupon not found" });
    return res.json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    console.error("Admin delete coupon error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete coupon" });
  }
});

module.exports = router;
