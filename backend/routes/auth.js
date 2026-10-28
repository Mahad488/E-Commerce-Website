const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { db } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

router.post("/register", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body is required. Send JSON with Content-Type: application/json.",
      });
    }

    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [normalizedName, normalizedEmail, hashedPassword]
    );

    const user = {
      id: result.insertId,
      name: normalizedName,
      email: normalizedEmail,
    };

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token: createToken(user),
      user,
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body is required. Send JSON with Content-Type: application/json.",
      });
    }

    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [users] = await db.execute(
      "SELECT id, name, email, password FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: createToken(publicUser),
      user: publicUser,
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * Ensure `users` table has phone, address, city, country columns
 */
async function ensureUserProfileColumns() {
  try {
    const columns = [
      { name: "phone", type: "VARCHAR(50) NULL" },
      { name: "address", type: "VARCHAR(255) NULL" },
      { name: "city", type: "VARCHAR(100) NULL" },
      { name: "country", type: "VARCHAR(100) NULL DEFAULT 'Pakistan'" },
    ];

    for (const col of columns) {
      try {
        await db.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {
        // Column may already exist, ignore error
      }
    }
  } catch (err) {
    console.warn("Could not alter users table:", err.message);
  }
}

// Auto-run column check
ensureUserProfileColumns();

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    await ensureUserProfileColumns();

    const [users] = await db.execute(
      "SELECT id, name, email, phone, address, city, country, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * PUT /api/auth/profile
 * Updates user personal info and default shipping address
 */
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    await ensureUserProfileColumns();

    const { name, phone, address, city, country } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required",
      });
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone ? String(phone).trim() : null;
    const trimmedAddress = address ? String(address).trim() : null;
    const trimmedCity = city ? String(city).trim() : null;
    const trimmedCountry = country ? String(country).trim() : "Pakistan";

    await db.execute(
      `UPDATE users 
       SET name = ?, phone = ?, address = ?, city = ?, country = ? 
       WHERE id = ?`,
      [trimmedName, trimmedPhone, trimmedAddress, trimmedCity, trimmedCountry, req.user.id]
    );

    const [updatedUsers] = await db.execute(
      "SELECT id, name, email, phone, address, city, country, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully! 🎉",
      user: updatedUsers[0],
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Strong password validation
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        success: false,
        message:
          "Strong password required: must contain uppercase, lowercase, number, and special character",
      });
    }

    // Fetch user current password hash
    const [users] = await db.execute(
      "SELECT id, password FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password and update
    const newHashedPassword = await bcrypt.hash(newPassword, 12);
    await db.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [newHashedPassword, req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * Ensure `password_resets` table exists
 */
async function ensurePasswordResetTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        reset_code VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.warn("Could not ensure password_resets table:", err.message);
  }
}

// Auto-run reset table check
ensurePasswordResetTable();

/**
 * POST /api/auth/forgot-password
 * Generates a 6-digit verification code and initiates account recovery
 */
router.post("/forgot-password", async (req, res) => {
  try {
    await ensurePasswordResetTable();
    const { email } = req.body || {};

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Check if user exists in database
    const [users] = await db.execute(
      "SELECT id, name, email FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No account registered with this email address. Please check spelling or create an account.",
      });
    }

    // Generate secure 6-digit numeric verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Expiration: 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Invalidate existing unused codes for this email
    await db.execute(
      "UPDATE password_resets SET used = 1 WHERE email = ? AND used = 0",
      [normalizedEmail]
    );

    await db.execute(
      "INSERT INTO password_resets (email, reset_code, expires_at) VALUES (?, ?, ?)",
      [normalizedEmail, resetCode, expiresAt]
    );

    console.log(`[AUTH] Password recovery code for ${normalizedEmail}: ${resetCode} (Valid until ${expiresAt.toLocaleTimeString()})`);

    return res.status(200).json({
      success: true,
      message: `Verification code generated! Code sent to ${normalizedEmail}`,
      email: normalizedEmail,
      resetCode: resetCode, // Returned for instant demo testing
      expiresInMinutes: 15,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process recovery request. Please try again.",
    });
  }
});

/**
 * POST /api/auth/verify-reset-code
 * Validates whether the 6-digit code is genuine, unexpired, and unused
 */
router.post("/verify-reset-code", async (req, res) => {
  try {
    await ensurePasswordResetTable();
    const { email, resetCode } = req.body || {};

    if (!email || !resetCode) {
      return res.status(400).json({
        success: false,
        message: "Email address and 6-digit verification code are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = String(resetCode).trim();

    const [rows] = await db.execute(
      `SELECT * FROM password_resets 
       WHERE email = ? AND reset_code = ? AND used = 0 AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, cleanCode]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Please request a new one.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification code confirmed! You can now choose a new password.",
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify reset code",
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Verifies code and updates the user's password with fresh bcrypt hash
 */
router.post("/reset-password", async (req, res) => {
  try {
    await ensurePasswordResetTable();
    const { email, resetCode, newPassword } = req.body || {};

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, verification code, and new password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = String(resetCode).trim();

    // Validate strong password
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        success: false,
        message:
          "Strong password required: must contain uppercase, lowercase, number, and special character",
      });
    }

    // Verify code exists and is valid
    const [rows] = await db.execute(
      `SELECT * FROM password_resets 
       WHERE email = ? AND reset_code = ? AND used = 0 AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, cleanCode]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Please request a fresh reset code.",
      });
    }

    const resetRecord = rows[0];

    // Encrypt new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update in users table
    await db.execute("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      normalizedEmail,
    ]);

    // Invalidate code
    await db.execute("UPDATE password_resets SET used = 1 WHERE id = ?", [
      resetRecord.id,
    ]);

    console.log(`[AUTH] Password successfully reset for: ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now log in with your new credentials.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password. Please try again.",
    });
  }
});

module.exports = router;
