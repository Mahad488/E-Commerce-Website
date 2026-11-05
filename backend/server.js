const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const { db, testConnection } = require("./config/db");
const { ensureSchema } = require("./database/migrate");
const { seedIfEmpty } = require("./database/seed");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const storeRoutes = require("./routes/store");
const paymentRoutes = require("./routes/payments");
const { startPayments } = require("./services/paymentService");
const { adminRouter } = require("./admin");
const { UPLOADS_ROOT } = require("./services/storage");
const { checkEmailTransport } = require("./services/email");

const app = express();

// CORS: open in development, restricted to CLIENT_URL (comma-separated) when set.
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));

// Stripe signs the exact bytes it sends, so the webhook gets the raw body (before express.json).
app.use("/api/payments/webhook", express.raw({ type: "*/*", limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));
// Uploaded images have random UUID names, so they never change and can be cached for a long time.
app.use(
  "/uploads",
  express.static(UPLOADS_ROOT, {
    index: false,
    maxAge: "30d",
    immutable: true,
    setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", storeRoutes);
app.use("/api/admin", adminRouter);

app.get("/", (req, res) => {
  res.json({ success: true, message: "NOVA E-Commerce API is running" });
});

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ success: true, message: "Backend is healthy", database: "connected" });
  } catch {
    res.status(503).json({ success: false, message: "Database unavailable", database: "disconnected" });
  }
});

app.get("/api/email-status", async (req, res) => {
  const { smtpConfig, getTransporter } = require("./services/email");

  // Check Brevo REST API
  if (process.env.BREVO_API_KEY) {
    return res.json({
      configured: true,
      ready: true,
      provider: "Brevo API (HTTPS / Port 443)",
      note: "Works seamlessly on Render Free Tier without SMTP port blocks.",
      sender: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || "muhammadmahad2021@gmail.com",
    });
  }

  // Check Resend REST API
  if (process.env.RESEND_API_KEY) {
    return res.json({
      configured: true,
      ready: true,
      provider: "Resend API (HTTPS / Port 443)",
      note: "Works seamlessly on Render Free Tier without SMTP port blocks.",
      from: process.env.RESEND_FROM || "NOVA Store <onboarding@resend.dev>",
    });
  }

  const config = smtpConfig();
  if (!config) {
    return res.json({
      configured: false,
      message: "No email provider configured. Set BREVO_API_KEY, RESEND_API_KEY or SMTP_HOST in Environment Variables.",
    });
  }

  try {
    await getTransporter().verify();
    return res.json({
      configured: true,
      ready: true,
      provider: "SMTP (Nodemailer)",
      host: config.host,
      port: config.port,
      user: config.auth?.user ? config.auth.user.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null,
      message: "SMTP connection verified! Server is ready to send emails.",
    });
  } catch (err) {
    const isRenderFreeBlock = err.code === "ETIMEDOUT" || err.message?.includes("timeout");
    return res.status(500).json({
      configured: true,
      ready: false,
      provider: "SMTP",
      error: err.message,
      code: err.code,
      recommendation: isRenderFreeBlock
        ? "Render Free Tier blocks outbound SMTP ports 25, 465, and 587. Add BREVO_API_KEY (from brevo.com) to Render environment to send emails over unblocked HTTPS."
        : "Check SMTP credentials and host configuration.",
    });
  }
});

// Unknown API routes → JSON 404 instead of Express's HTML page.
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: `No API route for ${req.method} ${req.originalUrl}` });
});

// Malformed JSON and any other unhandled error → clean JSON response.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Request body is not valid JSON" });
  }
  console.error("Unhandled error:", err);
  return res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`NOVA Backend running on port ${PORT}`);
  checkEmailTransport();
  const connected = await testConnection();
  if (!connected) return;

  try {
    await ensureSchema(db);
    await seedIfEmpty(db);
    startPayments();
  } catch (error) {
    console.error("[db] Schema check failed:", error.message);
  }
});
