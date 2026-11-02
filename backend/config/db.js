require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const pool = require("mysql2/promise").createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
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
    return true;
  } catch (error) {
    console.error("MySQL Connection Failed:", error.message);
    if (error.code === "ER_BAD_DB_ERROR") {
      console.error("  → The database doesn't exist yet. Run `npm run db:setup` in the backend folder.");
    }
    return false;
  }
}

module.exports = { db: pool, testConnection };
