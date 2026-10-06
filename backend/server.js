
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection } = require("./config/db");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NOVA E-Commerce API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`NOVA Backend running on port ${PORT}`);
  await testConnection();
});