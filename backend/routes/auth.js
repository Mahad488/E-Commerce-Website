const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { db } = require("../config/db");
const { getUserSecret, isProduction } = require("../config/secrets");
const { authenticateToken } = require("../middleware/auth");
const rateLimit = require("../middleware/rateLimit");
const { queueEmail } = require("../services/email");
const { sendPasswordReset } = require("../services/notifications");

const router = express.Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, name: "auth" });
const recoveryLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, name: "recovery" });

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    getUserSecret(),
    { expiresIn: "7d" }
  );
}

router.post("/register", authLimiter, async (req, res) => {
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

router.post("/login", authLimiter, async (req, res) => {
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
 * POST /api/auth/google
 * Authenticates with a Google OAuth ID Token (credential) or Access Token.
 * Verifies with Google, finds or auto-registers the user, and returns a session JWT.
 */
router.post("/google", authLimiter, async (req, res) => {
  try {
    const { credential, access_token } = req.body || {};

    if (!credential && !access_token) {
      return res.status(400).json({
        success: false,
        message: "Google credential or access token is required",
      });
    }

    let payload = null;

    if (credential) {
      // Verify Google ID token via Google's tokeninfo API
      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      if (!googleRes.ok) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired Google credential",
        });
      }
      payload = await googleRes.json();
    } else if (access_token) {
      // Verify via Google userinfo API
      const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!googleRes.ok) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired Google access token",
        });
      }
      payload = await googleRes.json();
    }

    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        message: "Failed to retrieve verified email from Google",
      });
    }

    // Check aud if configured
    const configuredClientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
    if (configuredClientId && payload.aud && payload.aud !== configuredClientId) {
      console.warn(`[auth] Google aud mismatch: received ${payload.aud}, expected ${configuredClientId}`);
    }

    const email = String(payload.email).trim().toLowerCase();
    const name = String(payload.name || payload.given_name || email.split("@")[0]).trim();

    // Check if user already exists
    const [existing] = await db.execute(
      "SELECT id, name, email FROM users WHERE email = ?",
      [email]
    );

    let user;
    if (existing.length > 0) {
      user = existing[0];
    } else {
      // Auto-register new user with a random secure password hash
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const [result] = await db.execute(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword]
      );

      user = {
        id: result.insertId,
        name,
        email,
      };
    }

    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    return res.status(200).json({
      success: true,
      message: "Signed in with Google successfully",
      token: createToken(publicUser),
      user: publicUser,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during Google sign in",
    });
  }
});

router.get("/profile", authenticateToken, async (req, res) => {
  try {
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

    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
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
 * POST /api/auth/forgot-password
 * Generates a 6-digit verification code and initiates account recovery
 */
router.post("/forgot-password", recoveryLimiter, async (req, res) => {
  try {
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
      if (isProduction) {
        // Don't reveal which emails have accounts.
        return res.status(200).json({
          success: true,
          message: "If that email is registered, a verification code is on its way.",
          email: normalizedEmail,
          expiresInMinutes: 15,
        });
      }
      return res.status(404).json({
        success: false,
        message: "No account registered with this email address. Please check spelling or create an account.",
      });
    }

    // Cryptographically secure 6-digit verification code
    const resetCode = crypto.randomInt(100000, 1000000).toString();
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

    // Emailed after the response goes out. Without SMTP (local dev) the email, code included,
    // is printed to the API terminal instead.
    const user = users[0];
    queueEmail("password reset code", () =>
      sendPasswordReset({ email: user.email, name: user.name, code: resetCode, expiresInMinutes: 15 })
    );

    const response = {
      success: true,
      message: `Verification code sent to ${normalizedEmail}`,
      email: normalizedEmail,
      expiresInMinutes: 15,
    };
    return res.status(200).json(response);
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
router.post("/verify-reset-code", recoveryLimiter, async (req, res) => {
  try {
    const { email, resetCode } = req.body || {};

    if (typeof email !== "string" || !resetCode) {
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
router.post("/reset-password", recoveryLimiter, async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body || {};

    if (typeof email !== "string" || !resetCode || typeof newPassword !== "string" || !newPassword) {
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
