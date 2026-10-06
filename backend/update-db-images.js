const { db } = require("./config/db");

const imageMap = {
  "Classic Cotton T-Shirt": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
  "Premium Running Shoes": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
  "Wireless Headphones": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
  "Smart Watch": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
  "Leather Backpack": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
  "Minimalist Watch": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80",
  "Classic Sunglasses": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
  "Premium Coffee Mug": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80",
  "Wireless Noise-Canceling Headphones": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
  "Ergonomic Mechanical Keyboard": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
  "Minimalist Leather Watch": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
  "Running Sports Shoes": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
  "Smart Fitness Band": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=600&q=80",
  "Canvas Backpack": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80"
};

async function updateImages() {
  try {
    for (const [name, url] of Object.entries(imageMap)) {
      await db.execute("UPDATE products SET image = ? WHERE name = ?", [url, name]);
    }
    
    // Also fix any unsplash URLs missing query params
    await db.execute(
      `UPDATE products 
       SET image = CONCAT(image, '?auto=format&fit=crop&w=600&q=80') 
       WHERE image LIKE 'https://images.unsplash.com%' AND image NOT LIKE '%?%'`
    );

    console.log("Successfully updated all product images in MySQL database!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to update images:", err);
    process.exit(1);
  }
}

updateImages();
