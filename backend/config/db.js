
require("dotenv").config();

const pool = require("mysql2/promise").createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "nova_ecommerce",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();

    console.log("MySQL Database Connected Successfully!");

    connection.release();
  } catch (error) {
    console.error("MySQL Connection Failed:", error.message);
  }
}

module.exports = { db: pool, testConnection };