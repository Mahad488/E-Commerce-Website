const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db } = require("../config/db");
const { getAdminSecret } = require("../config/secrets");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

const isBcryptHash = (value) => /^\$2[aby]\$/.test(String(value || ""));

function signAdminToken(username) {
  return jwt.sign({ role: "admin", username }, getAdminSecret(), { expiresIn: "8h" });
}

/**
 * Checks a password against a stored value. Legacy plain-text rows are
 * accepted once and immediately upgraded to a bcrypt hash.
 */
async function verifyStoredPassword(adminRow, password) {
  if (isBcryptHash(adminRow.password)) {
    return bcrypt.compare(password, adminRow.password);
  }
  const ok = password === adminRow.password;
  if (ok) {
    const hashed = await bcrypt.hash(password, 10);
    await db.query("UPDATE admins SET password = ? WHERE id = ?", [hashed, adminRow.id]);
  }
  return ok;
}

/**
 * POST /api/admin/login
 */
router.post("/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 20, name: "admin-login" }), async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }

  const cleanUser = String(username).trim();
  const cleanPass = String(password).trim();

  try {
    const [[{ adminCount }]] = await db.query("SELECT COUNT(*) AS adminCount FROM admins");
    let verifiedUser = null;

    if (Number(adminCount) > 0) {
      const [rows] = await db.query("SELECT * FROM admins WHERE username = ? LIMIT 1", [cleanUser]);
      if (rows.length > 0 && (await verifyStoredPassword(rows[0], cleanPass))) {
        verifiedUser = rows[0].username;
      }
    } else {
      // No admin rows yet (e.g. a brand-new database): allow the .env credentials once.
      const expectedUser = (process.env.ADMIN_USERNAME || "").trim();
      const expectedPass = (process.env.ADMIN_PASSWORD || "").trim();
      if (expectedUser && expectedPass && cleanUser === expectedUser && cleanPass === expectedPass) {
        const hashed = await bcrypt.hash(cleanPass, 10);
        await db.query("INSERT INTO admins (username, password) VALUES (?, ?)", [expectedUser, hashed]);
        verifiedUser = expectedUser;
      }
    }

    if (!verifiedUser) {
      return res.status(401).json({ success: false, message: "Invalid admin username or password" });
    }

    return res.json({
      success: true,
      message: "Login successful",
      token: signAdminToken(verifiedUser),
      username: verifiedUser,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ success: false, message: "Login processing failed" });
  }
});

/**
 * Middleware: verify the admin JWT.
 */
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Admin token required" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Invalid authorization header" });
  }

  try {
    const decoded = jwt.verify(token, getAdminSecret());
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access only" });
    }
    req.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired admin token" });
  }
}

/**
 * GET /api/admin/profile
 */
router.get("/profile", verifyAdmin, (req, res) => {
  return res.json({ success: true, username: req.admin.username });
});

/**
 * PUT /api/admin/change-password
 * Changes the admin's password (and optionally username).
 */
router.put("/change-password", verifyAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword, newUsername } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are both required",
      });
    }

    const cleanCurrentPass = String(currentPassword).trim();
    const cleanNewPass = String(newPassword).trim();
    const cleanNewUser = newUsername ? String(newUsername).trim() : req.admin.username;

    if (cleanNewPass.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters long" });
    }
    if (!cleanNewUser) {
      return res.status(400).json({ success: false, message: "Admin username cannot be blank" });
    }

    const [rows] = await db.query("SELECT * FROM admins WHERE username = ? LIMIT 1", [req.admin.username]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Admin account not found. Please sign in again." });
    }

    if (!(await verifyStoredPassword(rows[0], cleanCurrentPass))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect. Verification failed." });
    }

    if (cleanNewUser !== rows[0].username) {
      const [taken] = await db.query("SELECT id FROM admins WHERE username = ? AND id <> ?", [cleanNewUser, rows[0].id]);
      if (taken.length > 0) {
        return res.status(409).json({ success: false, message: "That username is already taken" });
      }
    }

    const hashedNewPassword = await bcrypt.hash(cleanNewPass, 10);
    await db.query("UPDATE admins SET username = ?, password = ? WHERE id = ?", [
      cleanNewUser,
      hashedNewPassword,
      rows[0].id,
    ]);

    return res.json({
      success: true,
      message: "Admin password updated successfully! 🎉",
      token: signAdminToken(cleanNewUser),
      username: cleanNewUser,
    });
  } catch (error) {
    console.error("Admin change password error:", error);
    return res.status(500).json({ success: false, message: "Failed to update admin credentials" });
  }
});

module.exports = {
  authRouter: router,
  verifyAdmin,
};
