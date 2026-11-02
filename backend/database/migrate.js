/**
 * Creates every table the API needs and upgrades older tables in place.
 * Runs automatically when the server starts and from `npm run db:setup`.
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const SCHEMA_PATH = path.join(__dirname, "schema.sql");

// Columns added after the first version of the project. Older databases are
// upgraded with ALTER TABLE so nobody has to drop their data.
const COLUMN_UPGRADES = {
  users: {
    phone: "VARCHAR(50) NULL",
    address: "VARCHAR(255) NULL",
    city: "VARCHAR(100) NULL",
    country: "VARCHAR(100) NULL DEFAULT 'Pakistan'",
    created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  },
  products: {
    old_price: "DECIMAL(10, 2) NULL",
    image: "VARCHAR(500) NULL",
    stock: "INT NOT NULL DEFAULT 0",
    rating: "DECIMAL(2, 1) NOT NULL DEFAULT 0",
    colors: "JSON NULL",
    created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  },
  orders: {
    subtotal: "DECIMAL(10, 2) NOT NULL DEFAULT 0",
    shipping_fee: "DECIMAL(10, 2) NOT NULL DEFAULT 0",
    discount_amount: "DECIMAL(10, 2) NOT NULL DEFAULT 0",
    coupon_code: "VARCHAR(50) NULL",
    address: "VARCHAR(255) NULL",
    mobile_number: "VARCHAR(50) NULL",
    city: "VARCHAR(100) NULL",
    country: "VARCHAR(100) NULL",
    payment_method: "VARCHAR(100) NULL",
    payment_status: "VARCHAR(50) DEFAULT 'Pending'",
    transaction_id: "VARCHAR(100) NULL",
    updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
  },
  order_items: {
    color: "VARCHAR(100) NULL",
    color_image: "VARCHAR(500) NULL",
  },
};

function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) =>
      statement
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter(Boolean);
}

async function getExistingColumns(db, table) {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return new Set(rows.map((row) => row.name));
}

async function ensureDefaultAdmin(db) {
  const [rows] = await db.query("SELECT id FROM admins LIMIT 1");
  if (rows.length > 0) return false;

  const username = (process.env.ADMIN_USERNAME || "nova_admin").trim();
  const password = (process.env.ADMIN_PASSWORD || "Nova@Admin#2024").trim();
  const hashed = await bcrypt.hash(password, 10);

  await db.query("INSERT INTO admins (username, password) VALUES (?, ?)", [username, hashed]);
  console.log(`[db] Created default admin account "${username}".`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn("[db] Using the default admin password — change it from the admin portal settings.");
  }
  return true;
}

async function ensureSchema(db) {
  const sql = fs.readFileSync(SCHEMA_PATH, "utf8");
  for (const statement of splitStatements(sql)) {
    await db.query(statement);
  }

  for (const [table, columns] of Object.entries(COLUMN_UPGRADES)) {
    const existing = await getExistingColumns(db, table);
    for (const [column, definition] of Object.entries(columns)) {
      if (!existing.has(column)) {
        await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`[db] Added column ${table}.${column}`);
      }
    }
  }

  // Older databases stored totals without a subtotal; backfill so analytics stay correct.
  await db.query("UPDATE orders SET subtotal = total_amount WHERE subtotal = 0 AND total_amount > 0");

  const createdAdmin = await ensureDefaultAdmin(db);
  return { createdAdmin };
}

module.exports = { ensureSchema };
