/**
 * One-command database setup:  npm run db:setup
 *   1. creates the database named in DB_NAME if it does not exist
 *   2. creates / upgrades every table
 *   3. seeds the demo catalogue when the products table is empty
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mysql = require("mysql2/promise");
const { ensureSchema } = require("./migrate");
const { seedIfEmpty } = require("./seed");

async function main() {
  const database = process.env.DB_NAME || "nova_ecommerce";
  const connectionConfig = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  };

  const server = await mysql.createConnection(connectionConfig);
  await server.query(
    `CREATE DATABASE IF NOT EXISTS \`${database.replace(/`/g, "")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await server.end();
  console.log(`[db] Database "${database}" is ready.`);

  const db = await mysql.createConnection({ ...connectionConfig, database });
  const { createdAdmin } = await ensureSchema(db);
  await seedIfEmpty(db);
  await db.end();

  console.log("\n✅ Setup complete.");
  console.log(
    createdAdmin
      ? "   Admin portal:  created from ADMIN_USERNAME / ADMIN_PASSWORD in .env"
      : "   Admin portal:  sign in with your admin account (a new database needs ADMIN_USERNAME and ADMIN_PASSWORD in .env)"
  );
  console.log("   Coupons:       WELCOME10, SAVE15, NOVA20, FREESHIP\n");
}

main().catch((error) => {
  console.error("\n❌ Database setup failed:", error.message);
  console.error("   Check DB_HOST, DB_USER and DB_PASSWORD in backend/.env and make sure MySQL is running.\n");
  process.exit(1);
});
