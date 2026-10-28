const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { db } = require("../config/db");

const router = express.Router();

/**
 * Ensure the `admins` table exists in the database.
 * Auto-seeds default admin from environment if empty.
 */
async function ensureAdminTable() {
  try {
    const createSql =
      "CREATE TABLE IF NOT EXISTS admins (" +
      "id INT AUTO_INCREMENT PRIMARY KEY, " +
      "username VARCHAR(100) NOT NULL UNIQUE, " +
      "password VARCHAR(255) NOT NULL, " +
      "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
      ")";
    await db.query(createSql);

    const [rows] = await db.query("SELECT id FROM admins LIMIT 1");
    if (rows.length === 0) {
      const defaultUser = (process.env.ADMIN_USERNAME || "nova_admin").trim();
      const defaultPass = (process.env.ADMIN_PASSWORD || "Nova@Admin#2024").trim();
      const hashed = await bcrypt.hash(defaultPass, 10);
      await db.query("INSERT INTO admins (username, password) VALUES (?, ?)", [defaultUser, hashed]);
      console.log("Seeded default admin in MySQL database:", defaultUser);
    }
  } catch (err) {
    console.warn("Could not ensure admins table in DB (falling back to .env):", err.message);
  }
}

// Run table check on startup
ensureAdminTable();

/**
 * Helper: Safely update .env file with new credentials
 */
function syncEnvFile(username, password) {
  try {
    const envPath = path.join(__dirname, "../.env");
    if (!fs.existsSync(envPath)) return;

    let content = fs.readFileSync(envPath, "utf8");

    if (/ADMIN_USERNAME=.*/.test(content)) {
      content = content.replace(/ADMIN_USERNAME=.*/, `ADMIN_USERNAME=${username}`);
    } else {
      content += `\nADMIN_USERNAME=${username}`;
    }

    const escapedPass = password.includes(" ") || password.includes("#") || password.includes("@")
      ? `"${password}"`
      : password;

    if (/ADMIN_PASSWORD=.*/.test(content)) {
      content = content.replace(/ADMIN_PASSWORD=.*/, `ADMIN_PASSWORD=${escapedPass}`);
    } else {
      content += `\nADMIN_PASSWORD=${escapedPass}`;
    }

    fs.writeFileSync(envPath, content, "utf8");
    process.env.ADMIN_USERNAME = username;
    process.env.ADMIN_PASSWORD = password;
  } catch (err) {
    console.warn("Could not sync .env file:", err.message);
  }
}

/**
 * POST /api/admin/login
 * Strict credential verification against DB & fallback to .env
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }

  const cleanUser = String(username).trim();
  const cleanPass = String(password).trim();

  try {
    await ensureAdminTable();

    // Check in database first
    const [rows] = await db.query("SELECT * FROM admins WHERE username = ? LIMIT 1", [cleanUser]);

    let isValid = false;
    let verifiedUser = cleanUser;

    if (rows.length > 0) {
      const adminRecord = rows[0];
      verifiedUser = adminRecord.username;
      if (adminRecord.password.startsWith("$2b$") || adminRecord.password.startsWith("$2a$")) {
        isValid = await bcrypt.compare(cleanPass, adminRecord.password);
      } else {
        isValid = cleanPass === adminRecord.password;
      }
    } else {
      // Fallback check against environment variables
      const expectedUser = (process.env.ADMIN_USERNAME || "nova_admin").trim();
      const expectedPass = (process.env.ADMIN_PASSWORD || "Nova@Admin#2024").trim();

      if (cleanUser === expectedUser && cleanPass === expectedPass) {
        isValid = true;
        verifiedUser = expectedUser;
      }
    }

    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid admin username or password" });
    }

    const secret = process.env.ADMIN_SECRET || "nova_admin_jwt_secret_key_2024";
    const token = jwt.sign(
      { role: "admin", username: verifiedUser },
      secret,
      { expiresIn: "8h" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      username: verifiedUser,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ success: false, message: "Login processing failed" });
  }
});

/**
 * Middleware: Verify Admin JWT Token
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
    const secret = process.env.ADMIN_SECRET || "nova_admin_jwt_secret_key_2024";
    const decoded = jwt.verify(token, secret);
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access only" });
    }
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired admin token" });
  }
}

/**
 * GET /api/admin/profile
 * Returns current admin information
 */
router.get("/profile", verifyAdmin, async (req, res) => {
  try {
    return res.json({
      success: true,
      username: req.admin.username,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch admin profile" });
  }
});

/**
 * PUT /api/admin/change-password
 * Allows the admin to change their username and/or password
 */
router.put("/change-password", verifyAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword, newUsername } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are both required",
      });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const currentAdminUser = req.admin.username;
    const cleanCurrentPass = String(currentPassword).trim();
    const cleanNewPass = String(newPassword).trim();
    const cleanNewUser = newUsername ? String(newUsername).trim() : currentAdminUser;

    if (!cleanNewUser) {
      return res.status(400).json({ success: false, message: "Admin username cannot be blank" });
    }

    await ensureAdminTable();

    // Find admin in DB
    const [rows] = await db.query("SELECT * FROM admins WHERE username = ? LIMIT 1", [currentAdminUser]);

    let isCurrentValid = false;
    let adminId = null;

    if (rows.length > 0) {
      adminId = rows[0].id;
      if (rows[0].password.startsWith("$2b$") || rows[0].password.startsWith("$2a$")) {
        isCurrentValid = await bcrypt.compare(cleanCurrentPass, rows[0].password);
      } else {
        isCurrentValid = cleanCurrentPass === rows[0].password;
      }
    } else {
      // Check environment password
      const envPass = (process.env.ADMIN_PASSWORD || "Nova@Admin#2024").trim();
      isCurrentValid = cleanCurrentPass === envPass;
    }

    if (!isCurrentValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect. Verification failed.",
      });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(cleanNewPass, 10);

    if (adminId) {
      await db.query(
        "UPDATE admins SET username = ?, password = ? WHERE id = ?",
        [cleanNewUser, hashedNewPassword, adminId]
      );
    } else {
      await db.query(
        "INSERT INTO admins (username, password) VALUES (?, ?)",
        [cleanNewUser, hashedNewPassword]
      );
    }

    // Sync .env file
    syncEnvFile(cleanNewUser, cleanNewPass);

    // Issue a refreshed JWT token for the updated user
    const secret = process.env.ADMIN_SECRET || "nova_admin_jwt_secret_key_2024";
    const newToken = jwt.sign(
      { role: "admin", username: cleanNewUser },
      secret,
      { expiresIn: "8h" }
    );

    return res.json({
      success: true,
      message: "Admin password updated successfully! 🎉",
      token: newToken,
      username: cleanNewUser,
    });
  } catch (error) {
    console.error("Admin change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update admin credentials. " + (error.message || ""),
    });
  }
});

module.exports = {
  authRouter: router,
  verifyAdmin,
};
