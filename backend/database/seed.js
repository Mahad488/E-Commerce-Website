/**
 * Demo catalogue, coupons, reviews and a demo shopper.
 * Only runs when the products table is empty, so it never touches a real catalogue.
 */
const bcrypt = require("bcryptjs");

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const PRODUCTS = [
  // Fashion
  {
    name: "Premium Casual Jacket",
    category: "Fashion",
    price: 89.99,
    oldPrice: 120,
    stock: 15,
    image: img("1551028719-00167b16eac5"),
    description:
      "A tailored casual jacket in breathable cotton twill with a soft brushed lining. Clean lines, two-way zip and deep pockets make it the layer you reach for every day.",
    colors: [
      { name: "Olive", hex: "#556b2f", quantity: 7, image: img("1551028719-00167b16eac5") },
      { name: "Midnight Black", hex: "#111111", quantity: 5 },
      { name: "Desert Tan", hex: "#c8a27a", quantity: 3 },
    ],
  },
  {
    name: "Essential Cotton Tee",
    category: "Fashion",
    price: 29,
    oldPrice: 40,
    stock: 40,
    image: img("1521572163474-6864f9cf17ab"),
    description:
      "Heavyweight 220gsm organic cotton with a relaxed fit and reinforced collar that keeps its shape wash after wash.",
    colors: [
      { name: "Cloud White", hex: "#f5f5f5", quantity: 18 },
      { name: "Jet Black", hex: "#1a1a1a", quantity: 14 },
      { name: "Navy", hex: "#1f2a44", quantity: 8 },
    ],
  },
  {
    name: "Urban Pullover Hoodie",
    category: "Fashion",
    price: 59,
    oldPrice: 79,
    stock: 22,
    image: img("1556821840-3a63f95609a7"),
    description:
      "Brushed-fleece hoodie with a double-lined hood, kangaroo pocket and ribbed cuffs. Built for cold mornings and late nights.",
  },
  // Footwear
  {
    name: "Classic Street Sneakers",
    category: "Footwear",
    price: 65,
    oldPrice: 85,
    stock: 20,
    image: img("1542291026-7eec264c27ff"),
    description:
      "Everyday sneakers with a cushioned midsole, grippy rubber outsole and a breathable upper that looks sharp with anything.",
    colors: [
      { name: "Crimson Red", hex: "#c0262d", quantity: 12, image: img("1542291026-7eec264c27ff") },
      { name: "Multi Colour", hex: "#e8c547", quantity: 8, image: img("1491553895911-0055eca6402d") },
    ],
  },
  {
    name: "AirFlow Running Shoes",
    category: "Footwear",
    price: 95,
    oldPrice: 130,
    stock: 4,
    image: img("1595950653106-6c9ebd614d3a"),
    description:
      "Lightweight running shoes with responsive foam, a knit upper that moves with your foot and a heel counter for stability on long runs.",
  },
  {
    name: "Everyday Canvas Sneakers",
    category: "Footwear",
    price: 49,
    oldPrice: null,
    stock: 30,
    image: img("1600185365483-26d7a4cc7519"),
    description: "Low-top canvas sneakers with a vulcanised sole. Simple, comfortable and made to be worn in.",
  },
  // Accessories
  {
    name: "Minimal Wrist Watch",
    category: "Accessories",
    price: 110,
    oldPrice: 140,
    stock: 12,
    image: img("1523275335684-37898b6baf30"),
    description:
      "A minimalist 40mm watch with sapphire-coated glass, Japanese quartz movement and an interchangeable leather strap.",
    colors: [
      { name: "Silver", hex: "#c0c0c0", quantity: 7, image: img("1523275335684-37898b6baf30") },
      { name: "Onyx Black", hex: "#222222", quantity: 5, image: img("1524805444758-089113d48a6d") },
    ],
  },
  {
    name: "Classic Aviator Sunglasses",
    category: "Accessories",
    price: 35,
    oldPrice: 50,
    stock: 30,
    image: img("1511499767150-a48a237f0083"),
    description: "Polarised UV400 lenses in a lightweight metal frame. Timeless shape, modern protection.",
  },
  {
    name: "Retro Round Sunglasses",
    category: "Accessories",
    price: 42,
    oldPrice: null,
    stock: 3,
    image: img("1572635196237-14b3f281503f"),
    description: "Round acetate frames with gradient lenses — a vintage silhouette with all-day comfort.",
  },
  {
    name: "Signature Eau de Parfum",
    category: "Accessories",
    price: 78,
    oldPrice: 95,
    stock: 18,
    image: img("1585386959984-a4155224a1ad"),
    description: "Warm amber, cedar and a hint of bergamot. A long-lasting 100ml fragrance for day and night.",
  },
  // Electronics
  {
    name: "Studio Wireless Headphones",
    category: "Electronics",
    price: 95,
    oldPrice: 125,
    stock: 10,
    image: img("1505740420928-5e560c06d30e"),
    description:
      "Over-ear headphones with active noise cancelling, 40-hour battery life and memory-foam ear cushions for long listening sessions.",
    colors: [
      { name: "Graphite", hex: "#2d2d2d", quantity: 6, image: img("1505740420928-5e560c06d30e") },
      { name: "Pearl White", hex: "#ececec", quantity: 4, image: img("1546435770-a3e426bf472b") },
    ],
  },
  {
    name: "Pro Wireless Earbuds",
    category: "Electronics",
    price: 129,
    oldPrice: 159,
    stock: 14,
    image: img("1590658268037-6bf12165a8df"),
    description: "True wireless earbuds with adaptive ANC, transparency mode and a pocket-sized wireless charging case.",
  },
  {
    name: "Portable Bluetooth Speaker",
    category: "Electronics",
    price: 69,
    oldPrice: null,
    stock: 25,
    image: img("1608043152269-423dbba4e7e1"),
    description: "360° sound, deep bass and 18 hours of playtime in a waterproof, drop-resistant body.",
  },
  {
    name: "Vintage Instant Camera",
    category: "Electronics",
    price: 149,
    oldPrice: 189,
    stock: 5,
    image: img("1526170375885-4d8ecf77b99f"),
    description: "Classic rangefinder styling with modern internals. Shoot, print and share in seconds.",
  },
  // Lifestyle
  {
    name: "Premium Leather Backpack",
    category: "Lifestyle",
    price: 55,
    oldPrice: 75,
    stock: 25,
    image: img("1553062407-98eeb64c6a62"),
    description: "Full-grain leather backpack with a padded 15-inch laptop sleeve and water-resistant lining.",
  },
  {
    name: "Ceramic Coffee Mug",
    category: "Lifestyle",
    price: 18,
    oldPrice: null,
    stock: 60,
    image: img("1514228742587-6b1558fcca3d"),
    description: "Hand-glazed 350ml stoneware mug. Microwave and dishwasher safe, and nice to hold.",
  },
  {
    name: "Insulated Steel Bottle",
    category: "Lifestyle",
    price: 25,
    oldPrice: 32,
    stock: 40,
    image: img("1602143407151-7111542de6e8"),
    description: "Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12. Leak-proof lid.",
  },
  // Gaming & Tech
  {
    name: "Mechanical RGB Keyboard",
    category: "Gaming & Tech",
    price: 119,
    oldPrice: 149,
    stock: 9,
    image: img("1587829741301-dc798b83add3"),
    description: "Hot-swappable switches, per-key RGB lighting and an aluminium top plate. Feels as good as it sounds.",
  },
  {
    name: "Precision Wireless Mouse",
    category: "Gaming & Tech",
    price: 45,
    oldPrice: null,
    stock: 35,
    image: img("1527864550417-7fd91fc51a46"),
    description: "26K DPI sensor, 70-hour battery and an ergonomic shape for long sessions.",
  },
  {
    name: "Smart Fitness Band",
    category: "Gaming & Tech",
    price: 49,
    oldPrice: 69,
    stock: 2,
    image: img("1575311373937-040b8e1fd5b6"),
    description: "Heart rate, sleep and SpO2 tracking with a 10-day battery and a bright AMOLED display.",
  },
];

const REVIEWS = [
  ["Premium Casual Jacket", "Ahmad Hassan", 5, "Outstanding build quality and fast shipping. The olive colour looks even better in person."],
  ["Premium Casual Jacket", "Sara Khan", 4, "Very comfortable and warm without being bulky. Sleeves run slightly long."],
  ["Classic Street Sneakers", "Bilal Tariq", 5, "Perfect fit and super comfortable straight out of the box."],
  ["Classic Street Sneakers", "Hina Malik", 4, "Great everyday pair. The red is bold — I love it."],
  ["Minimal Wrist Watch", "Zainab Ali", 5, "Minimalist luxury at a very reasonable price. Gets compliments every week."],
  ["Studio Wireless Headphones", "Usman Raza", 5, "Noise cancelling is excellent on flights and the battery lasts forever."],
  ["Studio Wireless Headphones", "Ayesha Siddiqui", 4, "Comfortable for hours. Wish the case was a bit smaller."],
  ["Pro Wireless Earbuds", "Hamza Qureshi", 5, "Crisp sound and the case charges wirelessly. Worth it."],
  ["Mechanical RGB Keyboard", "Faraz Ahmed", 5, "Typing feels amazing and the lighting is fully customisable."],
  ["Mechanical RGB Keyboard", "Maryam Nawaz", 4, "Solid build. Took a day to get used to the switches."],
  ["Premium Leather Backpack", "Omar Farooq", 5, "Fits my laptop and gym gear. Leather is thick and smells great."],
  ["AirFlow Running Shoes", "Sana Javed", 5, "Light and bouncy — shaved time off my 10K."],
  ["Essential Cotton Tee", "Ali Haider", 4, "Thick fabric, keeps its shape. Ordered two more."],
  ["Vintage Instant Camera", "Noor Fatima", 5, "So much fun at parties. Prints come out in seconds."],
  ["Signature Eau de Parfum", "Danish Iqbal", 4, "Lasts all day. Warm and not overpowering."],
];

const COUPONS = [
  ["WELCOME10", "10% off your first order", "percent", 10, 0],
  ["SAVE15", "$15 off orders over $100", "fixed", 15, 100],
  ["NOVA20", "20% off orders over $150", "percent", 20, 150],
  ["FREESHIP", "Free shipping on any order", "shipping", 0, 0],
];

const DEMO_USER = {
  name: "Alex Morgan",
  email: "demo@nova.store",
  password: "Demo@1234",
  phone: "03001234567",
  address: "House 12, Street 4, F-7/2",
  city: "Islamabad",
  country: "Pakistan",
};

async function seedCoupons(db) {
  for (const [code, description, type, value, minOrder] of COUPONS) {
    await db.query(
      `INSERT IGNORE INTO coupons (code, description, discount_type, discount_value, min_order)
       VALUES (?, ?, ?, ?, ?)`,
      [code, description, type, value, minOrder]
    );
  }
}

async function seedDemoUser(db) {
  const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [DEMO_USER.email]);
  if (existing.length > 0) return existing[0].id;

  const hashed = await bcrypt.hash(DEMO_USER.password, 12);
  const [result] = await db.query(
    "INSERT INTO users (name, email, password, phone, address, city, country) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [DEMO_USER.name, DEMO_USER.email, hashed, DEMO_USER.phone, DEMO_USER.address, DEMO_USER.city, DEMO_USER.country]
  );
  return result.insertId;
}

/**
 * A few historical orders spread over the last two weeks so the admin
 * analytics dashboard has something to show on a fresh install.
 */
async function seedDemoOrders(db, userId, productIds) {
  const plan = [
    { daysAgo: 13, status: "Delivered", items: [[0, 1], [7, 1]] },
    { daysAgo: 11, status: "Delivered", items: [[3, 1]] },
    { daysAgo: 9, status: "Delivered", items: [[10, 1], [15, 2]] },
    { daysAgo: 7, status: "Delivered", items: [[17, 1]] },
    { daysAgo: 6, status: "Cancelled", items: [[13, 1]] },
    { daysAgo: 5, status: "Delivered", items: [[11, 1], [1, 2]] },
    { daysAgo: 4, status: "Shipped", items: [[6, 1]] },
    { daysAgo: 3, status: "Shipped", items: [[4, 1], [16, 1]] },
    { daysAgo: 2, status: "Processing", items: [[10, 1]] },
    { daysAgo: 1, status: "Processing", items: [[0, 1], [9, 1]] },
    { daysAgo: 0, status: "Pending", items: [[17, 1], [18, 1]] },
  ];
  const flow = ["Pending", "Processing", "Shipped", "Delivered"];

  for (const entry of plan) {
    const created = new Date(Date.now() - entry.daysAgo * 86400000 - 3600000 * (2 + entry.daysAgo % 5));
    let subtotal = 0;
    const lines = entry.items.map(([index, qty]) => {
      const product = PRODUCTS[index];
      subtotal += product.price * qty;
      return { productId: productIds[index], qty, price: product.price, color: product.colors?.[0]?.name || "Standard", image: product.image };
    });
    const shipping = subtotal >= 100 ? 0 : 10;
    const total = subtotal + shipping;
    const paid = entry.status === "Delivered" || entry.items.length > 1;

    const [orderResult] = await db.query(
      `INSERT INTO orders (user_id, subtotal, shipping_fee, discount_amount, total_amount, status, address, mobile_number, city, country,
        payment_method, payment_status, transaction_id, created_at)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        subtotal.toFixed(2),
        shipping.toFixed(2),
        total.toFixed(2),
        entry.status,
        DEMO_USER.address,
        DEMO_USER.phone,
        DEMO_USER.city,
        DEMO_USER.country,
        paid ? "Credit/Debit Card (Visa)" : "Cash on Delivery (COD)",
        paid ? "Paid" : "Pending",
        paid ? `TXN-CARD-${100000 + entry.daysAgo * 7919}` : `COD-${200000 + entry.daysAgo * 31}`,
        created,
      ]
    );

    for (const line of lines) {
      await db.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price, color, color_image) VALUES (?, ?, ?, ?, ?, ?)",
        [orderResult.insertId, line.productId, line.qty, line.price.toFixed(2), line.color, line.image]
      );
    }

    const steps = entry.status === "Cancelled" ? ["Pending", "Cancelled"] : flow.slice(0, flow.indexOf(entry.status) + 1);
    for (const [i, status] of steps.entries()) {
      await db.query("INSERT INTO order_status_history (order_id, status, created_at) VALUES (?, ?, ?)", [
        orderResult.insertId,
        status,
        new Date(created.getTime() + i * 26 * 3600000),
      ]);
    }
  }
}

async function seedIfEmpty(db, { withDemoOrders = process.env.SEED_DEMO_ORDERS !== "false" } = {}) {
  await seedCoupons(db);

  const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM products");
  if (Number(count) > 0) {
    // Existing catalogue: leave it alone, but make sure the demo login works in development.
    if (process.env.NODE_ENV !== "production") await seedDemoUser(db);
    return { seeded: false };
  }

  const productIds = [];
  for (const [index, p] of PRODUCTS.entries()) {
    const [result] = await db.query(
      `INSERT INTO products (name, category, description, price, old_price, image, stock, rating, colors, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        p.name,
        p.category,
        p.description,
        p.price,
        p.oldPrice,
        p.image,
        p.stock,
        p.colors ? JSON.stringify(p.colors) : null,
        // Stagger creation dates so "Newest" sorting is meaningful.
        new Date(Date.now() - (PRODUCTS.length - index) * 86400000),
      ]
    );
    productIds.push(result.insertId);
  }

  const idByName = new Map(PRODUCTS.map((p, i) => [p.name, productIds[i]]));
  for (const [i, [productName, userName, rating, comment]] of REVIEWS.entries()) {
    await db.query(
      "INSERT INTO reviews (product_id, user_name, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)",
      [idByName.get(productName), userName, rating, comment, new Date(Date.now() - (i + 1) * 2 * 86400000)]
    );
  }
  await db.query(
    `UPDATE products p
     JOIN (SELECT product_id, ROUND(AVG(rating), 1) AS avg_rating FROM reviews GROUP BY product_id) r
       ON r.product_id = p.id
     SET p.rating = r.avg_rating`
  );

  const demoUserId = await seedDemoUser(db);
  if (withDemoOrders) {
    await seedDemoOrders(db, demoUserId, productIds);
  }

  console.log(`[db] Seeded ${PRODUCTS.length} products, ${REVIEWS.length} reviews, ${COUPONS.length} coupons and the demo shopper.`);
  return { seeded: true };
}

module.exports = { seedIfEmpty, DEMO_USER, PRODUCTS };
