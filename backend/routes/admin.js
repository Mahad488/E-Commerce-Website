const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Admin Login — checks hardcoded env credentials
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password required" });
  }

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ success: false, message: "Invalid admin credentials" });
  }

  const token = jwt.sign(
    { role: "admin", username },
    process.env.ADMIN_SECRET,
    { expiresIn: "8h" }
  );

  return res.json({ success: true, token });
});

// Middleware to verify admin JWT
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Admin token required" });
  }

  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.ADMIN_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired admin token" });
  }
}

module.exports = { adminRouter: router, verifyAdmin };
